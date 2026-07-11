"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChefHat, Clock, IndianRupee, PackageX, Search, ShoppingBag, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { OrderCard } from "@/components/features/orders/order-card";
import { createClient } from "@/lib/supabase/client";
import { getDashboardSummary, getBranchMenu } from "@/lib/supabase/queries";
import { formatCurrency } from "@/lib/utils";
import { type OrderStatus } from "@/lib/constants";
import { useRealtimeOrders } from "@/hooks/use-realtime-orders";
import { useAuth } from "@/features/auth/auth-provider";

/**
 * The Counter — everything a small restaurant needs on one screen:
 * live orders with one-tap actions, today's money, and out-of-stock
 * toggles. A solo owner should be able to run full service from here
 * without ever opening another tab.
 */
export default function CounterPage() {
  const { branch, staff, organization, canAccess } = useAuth();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { orders, loading: ordersLoading, refresh } = useRealtimeOrders(branch?.id);
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data: summary } = useQuery({
    queryKey: ["dashboard-summary", branch?.id],
    queryFn: () => getDashboardSummary(supabase, branch!.id),
    enabled: !!branch,
    refetchInterval: 30000,
  });

  const activeOrders = useMemo(
    () => orders.filter((order) => !["served", "cancelled"].includes(order.status)),
    [orders]
  );

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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update order");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Good ${greeting()}, ${staff?.full_name?.split(" ")[0] ?? "there"}`}
        description={branch?.name ? `Running ${branch.name}` : "Your restaurant, one screen."}
        actions={
          canAccess("waiter") ? (
            <Link href="/dashboard/waiter">
              <Button size="lg">
                <ShoppingBag className="h-4 w-4" />
                New order
              </Button>
            </Link>
          ) : undefined
        }
      />

      <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today's earnings" value={formatCurrency(summary?.revenue ?? 0)} icon={IndianRupee} />
        <StatCard label="Orders today" value={summary?.ordersToday ?? 0} icon={ShoppingBag} tone="info" />
        <StatCard label="Active now" value={activeOrders.length} icon={Clock} tone="warning" />
        <StatCard
          label="Rating"
          value={summary?.averageRating ? summary.averageRating.toFixed(1) : "—"}
          icon={Star}
          tone="success"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.7fr)]">
        {/* Live order feed with inline actions */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <ChefHat className="h-4 w-4" />
              Live orders
            </h2>
            <Link href="/dashboard/orders" className="text-xs text-muted-foreground hover:text-foreground">
              History →
            </Link>
          </div>
          {ordersLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-40" />
              ))}
            </div>
          ) : activeOrders.length ? (
            <div className="grid gap-3">
              {activeOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  busy={busyId === order.id}
                  onStatusChange={(nextStatus) => void updateStatus(order.id, nextStatus)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={ShoppingBag}
              title="No active orders"
              description="New orders from QR scans and waiters appear here instantly."
            />
          )}
        </section>

        {/* Out-of-stock quick panel */}
        {canAccess("menu") || canAccess("kitchen") ? <StockPanel /> : null}
      </div>
    </div>
  );
}

/**
 * Tap-to-toggle availability. When a dish is switched off it fades out on
 * every customer menu within seconds (branch_dishes is in the realtime
 * publication).
 */
function StockPanel() {
  const { branch, organization } = useAuth();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [busyDish, setBusyDish] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["branch-menu", organization?.id],
    queryFn: () => getBranchMenu(supabase, organization!.id),
    enabled: !!organization,
  });

  const rows = useMemo(() => {
    if (!data || !branch) return [];
    return data.dishes
      .filter((dish) => dish.is_active)
      .map((dish) => {
        const link = dish.branch_dishes?.find((row) => row.branch_id === branch.id);
        return { id: dish.id, name: dish.name, available: link ? link.is_available : true, linked: !!link };
      })
      .filter((row) => !search || row.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => Number(a.available) - Number(b.available) || a.name.localeCompare(b.name));
  }, [data, branch, search]);

  const toggle = async (dishId: string, nextAvailable: boolean) => {
    if (!branch) return;
    setBusyDish(dishId);
    try {
      const { error } = await supabase
        .from("branch_dishes")
        .upsert({ branch_id: branch.id, dish_id: dishId, is_available: nextAvailable }, { onConflict: "branch_id,dish_id" });
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["branch-menu"] });
      toast.success(nextAvailable ? "Back in stock" : "Marked out of stock");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update stock");
    } finally {
      setBusyDish(null);
    }
  };

  return (
    <Card className="h-fit">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <PackageX className="h-4 w-4" />
          <h2 className="text-sm font-semibold">Out of stock</h2>
        </div>
        <p className="text-xs text-muted-foreground">Switch a dish off and it disappears from customer menus instantly.</p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9 h-9" placeholder="Find dish" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-10" />
            ))}
          </div>
        ) : (
          <div className="max-h-[26rem] space-y-1 overflow-y-auto pr-1">
            {rows.map((row) => (
              <div key={row.id} className="flex items-center justify-between gap-2 rounded-xl border bg-card px-3 py-2">
                <span className={`truncate text-sm ${row.available ? "" : "text-muted-foreground line-through"}`}>{row.name}</span>
                <Switch
                  checked={row.available}
                  disabled={busyDish === row.id}
                  onCheckedChange={(checked) => void toggle(row.id, checked)}
                  aria-label={`${row.name} availability`}
                />
              </div>
            ))}
            {!rows.length && <p className="py-4 text-center text-xs text-muted-foreground">No dishes found</p>}
          </div>
        )}
      </CardContent>
    </Card>
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

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
