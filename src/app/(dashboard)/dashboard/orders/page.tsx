"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Clock3, RefreshCw, Search, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { OrderCard } from "@/components/features/orders/order-card";
import { orderStatuses, orderStatusLabels, type OrderStatus } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { useRealtimeOrders } from "@/hooks/use-realtime-orders";
import { useAuth } from "@/features/auth/auth-provider";

type SourceFilter = "all" | "waiter" | "qr_customer" | "cashier";

export default function OrdersPage() {
  const { branch } = useAuth();
  const queryClient = useQueryClient();
  const { orders, loading, error, refresh } = useRealtimeOrders(branch?.id);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [source, setSource] = useState<SourceFilter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return orders.filter((order) => {
      const haystack = `${order.order_number} ${order.customer_name ?? ""} ${order.table_number ?? ""}`.toLowerCase();
      if (search && !haystack.includes(search.toLowerCase())) return false;
      if (status !== "all" && order.status !== status) return false;
      if (source !== "all" && order.order_source !== source) return false;
      return true;
    });
  }, [orders, search, source, status]);

  const stats = useMemo(() => {
    const active = orders.filter((order) => !["served", "cancelled"].includes(order.status));
    return {
      active: active.length,
      pending: orders.filter((order) => order.status === "pending").length,
      ready: orders.filter((order) => order.status === "ready").length,
      revenue: orders.filter((order) => order.status !== "cancelled").reduce((sum, order) => sum + Number(order.total), 0),
    };
  }, [orders]);

  const updateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    setBusyId(orderId);
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, itemStatus: statusToItemStatus(nextStatus) }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to update order");
      await refresh();
      await queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast.success("Order updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update order");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Orders"
        description="Track every table, QR, waiter, and cashier order in real time."
        actions={
          <Button variant="secondary" onClick={() => void refresh()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active orders" value={stats.active} icon={ShoppingCart} />
        <StatCard label="Pending confirmation" value={stats.pending} icon={AlertCircle} tone="warning" />
        <StatCard label="Ready to serve" value={stats.ready} icon={Clock3} tone="success" />
        <StatCard label="Order value" value={formatCurrency(stats.revenue)} icon={ShoppingCart} tone="info" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-64 flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search order, table, customer" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <Select value={status} onChange={(event) => setStatus(event.target.value as OrderStatus | "all")} className="w-48">
          <option value="all">All statuses</option>
          {orderStatuses.map((item) => (
            <option key={item} value={item}>
              {orderStatusLabels[item]}
            </option>
          ))}
        </Select>
        <Select value={source} onChange={(event) => setSource(event.target.value as SourceFilter)} className="w-48">
          <option value="all">All sources</option>
          <option value="qr_customer">QR customer</option>
          <option value="waiter">Waiter</option>
          <option value="cashier">Cashier</option>
        </Select>
      </div>
      {loading ? (
        <div className="grid gap-3 xl:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-64" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border bg-card p-6 text-sm text-destructive">{error}</div>
      ) : filtered.length ? (
        <div className="grid gap-3 xl:grid-cols-2">
          {filtered.map((order) => (
            <OrderCard key={order.id} order={order} busy={busyId === order.id} onStatusChange={(nextStatus) => void updateStatus(order.id, nextStatus)} />
          ))}
        </div>
      ) : (
        <EmptyState icon={ShoppingCart} title="No orders in this view" description="Change filters or create a waiter order to start service." />
      )}
    </div>
  );
}

function statusToItemStatus(status: OrderStatus) {
  if (status === "confirmed") return "accepted";
  if (status === "served") return "served";
  if (status === "cancelled") return "cancelled";
  if (status === "ready") return "ready";
  if (status === "preparing") return "preparing";
  return "pending";
}
