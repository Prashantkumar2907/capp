"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, Clock, IndianRupee, ShoppingBag, Star } from "lucide-react";
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
  const { branch } = useAuth();
  const [supabase] = useState(() => createClient());
  const [days, setDays] = useState(7);

  const summary = useQuery({
    queryKey: ["analytics", branch?.id, days],
    queryFn: () => getDashboardSummary(supabase, branch!.id, days),
    enabled: !!branch,
  });

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
  const revenueData = data?.dailyRevenue ?? [];
  const statusData = data?.statusCounts ?? [];
  const sourceData = data?.sourceCounts ?? [];

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
        <StatCard label="Revenue" value={formatCurrency(data?.rangeRevenue ?? 0)} icon={IndianRupee} />
        <StatCard label="Orders" value={data?.ordersInRange ?? 0} icon={ShoppingBag} tone="info" />
        <StatCard label="Average order" value={formatCurrency(data?.rangeAverageOrder ?? 0)} icon={BarChart3} tone="warning" />
        <StatCard label="Average rating" value={data?.averageRating ? data.averageRating.toFixed(1) : "No ratings"} icon={Star} tone="success" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
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
