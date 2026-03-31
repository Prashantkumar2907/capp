"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const CHART_COLOR = "#14b8a6"; // teal-500
const CHART_COLORS = ["#14b8a6", "#2dd4bf", "#5eead4", "#99f6e4", "#ccfbf1"];

export default function DashboardPage() {
  const { staff, branch } = useAuth();
  const [supabase] = useState(() => createClient());

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats", branch?.id],
    queryFn: async () => {
      if (!branch) return null;
      const today = new Date().toISOString().split("T")[0];

      const [ordersRes, revenueRes, staffRes] = await Promise.all([
        supabase
          .from("orders")
          .select("id, total, status, created_at")
          .eq("branch_id", branch.id)
          .gte("created_at", `${today}T00:00:00`)
          .order("created_at", { ascending: false }),
        supabase
          .from("orders")
          .select("total")
          .eq("branch_id", branch.id)
          .in("status", ["served"])
          .gte("created_at", `${today}T00:00:00`),
        supabase
          .from("staff")
          .select("id")
          .eq("branch_id", branch.id)
          .eq("is_active", true),
      ]);

      const orders = ordersRes.data || [];
      const revenue = (revenueRes.data || []).reduce((s, o) => s + (o.total || 0), 0);
      const activeStaff = staffRes.data?.length || 0;

      return { todayOrders: orders.length, todayRevenue: revenue, activeStaff, orders };
    },
    enabled: !!branch,
  });

  // Weekly revenue chart data (mock structure — will be filled from real data)
  const { data: weeklyData } = useQuery({
    queryKey: ["weekly-revenue", branch?.id],
    queryFn: async () => {
      if (!branch) return [];
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);
      const startStr = startDate.toISOString().split("T")[0];

      const { data } = await supabase
        .from("orders")
        .select("total, created_at")
        .eq("branch_id", branch.id)
        .in("status", ["served"])
        .gte("created_at", `${startStr}T00:00:00`);

      // Group by day client-side
      const dayMap: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dayMap[d.toISOString().split("T")[0]] = 0;
      }
      (data || []).forEach((o) => {
        const day = new Date(o.created_at).toISOString().split("T")[0];
        if (dayMap[day] !== undefined) dayMap[day] += o.total || 0;
      });

      return Object.entries(dayMap).map(([dateStr, revenue]) => ({
        day: new Date(dateStr).toLocaleDateString("en-IN", { weekday: "short" }),
        revenue,
      }));
    },
    enabled: !!branch,
  });

  // Order status distribution
  const { data: statusData } = useQuery({
    queryKey: ["order-status-dist", branch?.id],
    queryFn: async () => {
      if (!branch) return [];
      const { data } = await supabase
        .from("orders")
        .select("status")
        .eq("branch_id", branch.id)
        .gte("created_at", new Date(Date.now() - 86400000).toISOString());

      const counts: Record<string, number> = {};
      (data || []).forEach((o) => {
        counts[o.status] = (counts[o.status] || 0) + 1;
      });

      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    },
    enabled: !!branch,
  });

  const statCards = [
    { label: "Today's Revenue", value: formatCurrency(stats?.todayRevenue || 0), icon: IndianRupee, color: "text-teal-500" },
    { label: "Today's Orders", value: String(stats?.todayOrders || 0), icon: ShoppingBag, color: "text-teal-500" },
    { label: "Avg Order Value", value: formatCurrency(stats?.todayOrders ? (stats.todayRevenue || 0) / stats.todayOrders : 0), icon: TrendingUp, color: "text-teal-500" },
    { label: "Active Staff", value: String(stats?.activeStaff || 0), icon: Users, color: "text-teal-500" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold font-poppins">Dashboard</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Welcome back, {staff?.full_name} — {branch?.name}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <Card key={s.label} className="border-zinc-200 dark:border-zinc-800">
            <CardContent className="p-4">
              {isLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-medium">
                      {s.label}
                    </p>
                    <p className="text-xl font-bold mt-1">{s.value}</p>
                  </div>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Revenue Chart */}
        <Card className="card-hover lg:col-span-2 border-zinc-200 dark:border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-poppins">Weekly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8 }}
                    formatter={(value: any) => [formatCurrency(value), "Revenue"]}
                  />
                  <Bar dataKey="revenue" fill={CHART_COLOR} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Order Status */}
        <Card className="card-hover border-zinc-200 dark:border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-poppins">Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              {(statusData?.length || 0) > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      dataKey="value"
                      label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                      style={{ fontSize: 9 }}
                    >
                      {statusData?.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-zinc-400">
                  No orders today
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
