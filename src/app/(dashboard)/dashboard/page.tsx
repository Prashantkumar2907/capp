"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ChefHat, Clock, IndianRupee, ShoppingBag, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { OrderStatusBadge } from "@/components/shared/status-badge";
import { createClient } from "@/lib/supabase/client";
import { getDashboardSummary } from "@/lib/supabase/queries";
import { formatCurrency, timeAgo } from "@/lib/utils";
import { useAuth } from "@/features/auth/auth-provider";

export default function DashboardPage() {
  const { branch, staff } = useAuth();
  const supabase = createClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-summary", branch?.id],
    queryFn: () => getDashboardSummary(supabase, branch!.id),
    enabled: !!branch,
    refetchInterval: 30000,
  });

  if (isLoading) return <DashboardSkeleton />;

  if (error || !data) {
    return <div className="rounded-2xl border bg-card p-6 text-sm text-destructive">Unable to load dashboard.</div>;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Good ${greeting()}, ${staff?.full_name?.split(" ")[0] ?? "there"}`}
        description={`Live operations for ${branch?.name ?? "your branch"}.`}
        actions={
          <>
            <Link href="/dashboard/waiter">
              <Button variant="secondary">
                <ShoppingBag className="h-4 w-4" />
                New order
              </Button>
            </Link>
            <Link href="/dashboard/kitchen">
              <Button>
                <ChefHat className="h-4 w-4" />
                Kitchen
              </Button>
            </Link>
          </>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today revenue" value={formatCurrency(data.revenue)} icon={IndianRupee} />
        <StatCard label="Orders today" value={data.ordersToday} icon={ShoppingBag} tone="info" />
        <StatCard label="Active orders" value={data.activeOrders} icon={Clock} tone="warning" />
        <StatCard label="Average rating" value={data.averageRating ? data.averageRating.toFixed(1) : "No ratings"} icon={Star} tone="success" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <Card>
          <CardContent className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Recent orders</h2>
                <p className="text-xs text-muted-foreground">Newest orders across channels</p>
              </div>
              <Link href="/dashboard/orders">
                <Button variant="ghost" size="sm">
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
            <div className="space-y-2">
              {data.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-3">
                  <div className="min-w-0">
                    <p className="font-numbers text-xs font-semibold">#{order.order_number}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {order.table_number ? `Table ${order.table_number} | ` : ""}
                      {timeAgo(order.created_at)}
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                  <p className="font-numbers text-sm font-semibold">{formatCurrency(order.total)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold">Top dishes</h2>
            <p className="text-xs text-muted-foreground">Last 7 days by quantity</p>
            <div className="mt-4 space-y-3">
              {data.topDishes.length ? (
                data.topDishes.map((dish, index) => (
                  <div key={dish.name} className="flex items-center gap-3">
                    <div className="font-numbers flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs">{index + 1}</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{dish.name}</p>
                      <p className="text-xs text-muted-foreground">{dish.quantity} sold</p>
                    </div>
                    <p className="font-numbers text-xs font-semibold">{formatCurrency(dish.revenue)}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed p-6 text-center text-xs text-muted-foreground">Top dishes appear after orders are placed.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-12 w-80" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
