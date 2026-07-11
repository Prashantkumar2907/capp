"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, Clock, IndianRupee, ShoppingBag, Star, Store } from "lucide-react";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { createClient } from "@/lib/supabase/client";
import { getDashboardSummary } from "@/lib/supabase/queries";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/features/auth/auth-provider";

const chartColors = ["#128c7e", "#d99012", "#3275c9", "#0f9f6e", "#df3f3f", "#66736d"];

export default function AnalyticsPage() {
  const { branch, organization, hasRole } = useAuth();
  const [supabase] = useState(() => createClient());
  const [days, setDays] = useState(7);

  const summary = useQuery({
    queryKey: ["analytics", branch?.id, days],
    queryFn: () => getDashboardSummary(supabase, branch!.id, days),
    enabled: !!branch,
  });

  const revenueData = useMemo(() => {
    const map = new Map<string, { date: string; revenue: number; orders: number }>();
    summary.data?.orders.forEach((order) => {
      const date = new Intl.DateTimeFormat("en-IN", { month: "short", day: "numeric" }).format(new Date(order.created_at));
      const current = map.get(date) ?? { date, revenue: 0, orders: 0 };
      current.revenue += Number(order.total);
      current.orders += 1;
      map.set(date, current);
    });
    return [...map.values()];
  }, [summary.data?.orders]);

  const statusData = useMemo(() => {
    const map = new Map<string, number>();
    summary.data?.orders.forEach((order) => map.set(order.status, (map.get(order.status) ?? 0) + 1));
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [summary.data?.orders]);

  const sourceData = useMemo(() => {
    const map = new Map<string, number>();
    summary.data?.orders.forEach((order) => map.set(order.order_source.replace("_", " "), (map.get(order.order_source.replace("_", " ")) ?? 0) + 1));
    return [...map.entries()].map(([source, orders]) => ({ source, orders }));
  }, [summary.data?.orders]);

  if (summary.isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-12 w-80" />
        <div className="grid gap-3 xl:grid-cols-4">
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

  const data = summary.data;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Analytics"
        description="Revenue, throughput, sources, and menu signals for better decisions."
        actions={
          <Select value={String(days)} onChange={(event) => setDays(Number(event.target.value))} className="w-40">
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
          </Select>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue" value={formatCurrency(data?.orders.reduce((sum, order) => sum + Number(order.total), 0) ?? 0)} icon={IndianRupee} />
        <StatCard label="Orders" value={data?.orders.length ?? 0} icon={ShoppingBag} tone="info" />
        <StatCard label="Average order" value={formatCurrency(data?.averageOrder ?? 0)} icon={BarChart3} tone="warning" />
        <StatCard label="Average rating" value={data?.averageRating ? data.averageRating.toFixed(1) : "No ratings"} icon={Star} tone="success" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        {hasRole("owner", "admin") ? <BranchComparison orgId={organization?.id} days={days} /> : null}
        <ChartCard title="Revenue trend" description="Daily revenue and order count">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip formatter={(value, name) => (name === "revenue" ? formatCurrency(Number(value)) : value)} />
              <Line type="monotone" dataKey="revenue" stroke="#128c7e" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="orders" stroke="#d99012" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Order status" description="Current status distribution">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={64} outerRadius={104} paddingAngle={4}>
                {statusData.map((entry, index) => (
                  <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
        <ChartCard title="Order sources" description="QR, waiter, and cashier split">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={sourceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="source" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="orders" fill="#128c7e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <Card>
          <CardContent className="p-4">
            <div className="mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <div>
                <h2 className="text-sm font-semibold">Top dishes</h2>
                <p className="text-xs text-muted-foreground">Quantity and revenue contribution</p>
              </div>
            </div>
            <div className="space-y-3">
              {(data?.topDishes ?? []).map((dish, index) => (
                <div key={dish.name} className="flex items-center gap-3">
                  <div className="font-numbers flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs">{index + 1}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{dish.name}</p>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, dish.quantity * 12)}%` }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-numbers text-xs font-semibold">{dish.quantity}</p>
                    <p className="font-numbers text-[0.625rem] text-muted-foreground">{formatCurrency(dish.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ChartCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-4">
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}


/**
 * Owner view: revenue + order count per branch over the selected window.
 * Only meaningful for multi-branch orgs; hides itself for single-branch.
 */
function BranchComparison({ orgId, days }: { orgId?: string; days: number }) {
  const [supabase] = useState(() => createBrowserClient());
  const comparison = useQuery({
    queryKey: ["branch-comparison", orgId, days],
    queryFn: async () => {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const [{ data: branches, error: branchError }, { data: orders, error: orderError }] = await Promise.all([
        supabase.from("branches").select("id, name").eq("org_id", orgId!).eq("is_active", true),
        supabase.from("orders").select("branch_id, total, status, created_at").gte("created_at", since),
      ]);
      if (branchError) throw branchError;
      if (orderError) throw orderError;
      return (branches ?? []).map((row) => {
        const branchOrders = (orders ?? []).filter((order) => order.branch_id === row.id && order.status !== "cancelled");
        return {
          name: row.name,
          revenue: Math.round(branchOrders.reduce((sum, order) => sum + Number(order.total), 0)),
          orders: branchOrders.length,
        };
      }).sort((a, b) => b.revenue - a.revenue);
    },
    enabled: !!orgId,
  });

  if (!comparison.data || comparison.data.length < 2) return null;

  return (
    <ChartCard title="Branch comparison" description={`Revenue by branch, last ${days} days`}>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={comparison.data} layout="vertical" margin={{ left: 8, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
          <XAxis type="number" tickFormatter={(value) => `₹${value >= 1000 ? `${Math.round(value / 1000)}k` : value}`} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
          <Bar dataKey="revenue" radius={[0, 8, 8, 0]} className="fill-primary" />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
        {comparison.data.map((row) => (
          <div key={row.name} className="flex items-center justify-between">
            <span className="flex items-center gap-1.5"><Store className="h-3 w-3" />{row.name}</span>
            <span className="font-numbers">{row.orders} orders · {formatCurrency(row.revenue)}</span>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}
