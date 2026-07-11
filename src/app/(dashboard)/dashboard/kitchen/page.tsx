"use client";

import { useMemo, useState } from "react";
import { ChefHat, Flame, Printer, RefreshCw, Timer, Utensils } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { OrderStatusBadge } from "@/components/shared/status-badge";
import { orderStatusLabels, type OrderStatus } from "@/lib/constants";
import { timeAgo } from "@/lib/utils";
import { useRealtimeOrders } from "@/hooks/use-realtime-orders";
import { useAuth } from "@/features/auth/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Select } from "@/components/ui/select";
import { printKot } from "@/lib/print-kot";
import type { OrderWithItems } from "@/types/database";

const columns: Array<{ key: OrderStatus; title: string; action?: OrderStatus; actionLabel?: string }> = [
  { key: "pending", title: "New", action: "confirmed", actionLabel: "Accept" },
  { key: "confirmed", title: "Accepted", action: "preparing", actionLabel: "Start cooking" },
  { key: "preparing", title: "Cooking", action: "ready", actionLabel: "Mark ready" },
  { key: "ready", title: "Ready", action: "served", actionLabel: "Handed off" },
];

export default function KitchenPage() {
  const { branch, organization } = useAuth();
  const [supabaseClient] = useState(() => createClient());
  const [stationId, setStationId] = useState<string>("all");
  const stations = useQuery({
    queryKey: ["stations", branch?.id],
    queryFn: async () => {
      const { data, error } = await supabaseClient.from("stations").select("*").eq("branch_id", branch!.id).order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!branch,
  });

  /** With a station selected, only tickets containing that station's items count. */
  const itemMatchesStation = (item: { station_id?: string | null }) => stationId === "all" || item.station_id === stationId;
  const { orders, loading, error, refresh } = useRealtimeOrders(branch?.id);
  const [busyId, setBusyId] = useState<string | null>(null);

  const kitchenOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          ["pending", "confirmed", "preparing", "ready"].includes(order.status) &&
          (stationId === "all" || order.order_items.some((item) => item.status !== "cancelled" && item.station_id === stationId))
      ),
    [orders, stationId]
  );
  const itemCount = kitchenOrders.reduce((sum, order) => sum + order.order_items.filter((item) => item.status !== "cancelled" && itemMatchesStation(item)).reduce((inner, item) => inner + item.quantity, 0), 0);
  const oldest = kitchenOrders.length ? kitchenOrders[kitchenOrders.length - 1] : null;

  const updateStatus = async (order: OrderWithItems, status: OrderStatus) => {
    setBusyId(order.id);
    try {
      const response = await fetch(`/api/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, itemStatus: statusToItemStatus(status) }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to update ticket");
      await refresh();
      toast.success(`Order ${orderStatusLabels[status].toLowerCase()}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update ticket");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Kitchen display"
        description="A live rail for kitchen staff to accept, cook, and release orders."
        actions={
          <Button variant="secondary" onClick={() => void refresh()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Open tickets" value={kitchenOrders.length} icon={ChefHat} />
        <StatCard label="Items in queue" value={itemCount} icon={Utensils} tone="warning" />
        <StatCard label="Oldest ticket" value={oldest ? timeAgo(oldest.created_at) : "Clear"} icon={Timer} tone="success" />
      </div>
      {stations.data?.length ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Station</span>
          <button onClick={() => setStationId("all")} className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${stationId === "all" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-secondary"}`}>
            All
          </button>
          {stations.data.map((station) => (
            <button key={station.id} onClick={() => setStationId(station.id)} className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${stationId === station.id ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-secondary"}`}>
              {station.name}
            </button>
          ))}
        </div>
      ) : null}
      {loading ? (
        <div className="grid gap-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-80" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border bg-card p-6 text-sm text-destructive">{error}</div>
      ) : (
        <div className="grid gap-3 xl:grid-cols-4">
          {columns.map((column) => {
            const rows = kitchenOrders.filter((order) => order.status === column.key);
            return (
              <section key={column.key} className="fill-container min-h-[480px] rounded-2xl border bg-secondary/40">
                <header className="flex items-center justify-between border-b bg-card px-4 py-3">
                  <div>
                    <h2 className="text-sm font-semibold">{column.title}</h2>
                    <p className="text-xs text-muted-foreground">{rows.length} tickets</p>
                  </div>
                  <OrderStatusBadge status={column.key} />
                </header>
                <div className="scrollable-inner space-y-3 p-3">
                  {rows.length ? (
                    rows.map((order) => (
                      <Card key={order.id} className="border-primary/15">
                        <CardContent className="space-y-4 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-numbers text-sm font-semibold">
                                {order.order_type === "counter" ? `Token ${order.order_number.split("-").pop()}` : `#${order.order_number}`}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {order.table_number ? `Table ${order.table_number} | ` : order.order_type === "takeaway" ? "Takeaway | " : order.order_type === "counter" ? "Counter | " : ""}
                                {timeAgo(order.created_at)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-9 w-9" title="Print KOT" onClick={() => printKot(order, organization?.name)}>
                                <Printer className="h-4 w-4" />
                              </Button>
                              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-warning/10 text-warning">
                                <Flame className="h-4 w-4" />
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {order.order_items
                              .filter((item) => item.status !== "cancelled" && itemMatchesStation(item))
                              .map((item) => (
                                <div key={item.id} className="rounded-xl bg-secondary p-3">
                                  <div className="flex justify-between gap-3">
                                    <p className="text-sm font-medium">
                                      {item.dish_name}
                                      {item.variant_name ? <span className="text-muted-foreground"> · {item.variant_name}</span> : null}
                                    </p>
                                    <span className="font-numbers text-sm font-semibold">x{item.quantity}</span>
                                  </div>
                                  {Array.isArray(item.addons) && item.addons.length ? (
                                    <p className="mt-1 text-xs font-medium text-primary">
                                      + {(item.addons as { name: string }[]).map((addon) => addon.name).join(", ")}
                                    </p>
                                  ) : null}
                                  {item.notes ? <p className="mt-1 text-xs text-muted-foreground">{item.notes}</p> : null}
                                </div>
                              ))}
                          </div>
                          {column.action ? (
                            <Button className="w-full" disabled={busyId === order.id} onClick={() => void updateStatus(order, column.action!)}>
                              {column.actionLabel}
                            </Button>
                          ) : null}
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed bg-card p-6 text-center text-xs text-muted-foreground">No tickets here.</div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function statusToItemStatus(status: OrderStatus) {
  if (status === "confirmed") return "accepted";
  if (status === "preparing") return "preparing";
  if (status === "ready") return "ready";
  if (status === "served") return "served";
  if (status === "cancelled") return "cancelled";
  return "pending";
}
