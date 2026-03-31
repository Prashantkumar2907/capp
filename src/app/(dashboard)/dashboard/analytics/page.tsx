"use client";

import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/helpers";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from "recharts";
import { TrendingUp, ShoppingBag, Clock, Star } from "lucide-react";

const TEAL = "#14b8a6";
const COLORS = ["#14b8a6", "#0d9488", "#2dd4bf", "#5eead4", "#99f6e4"];

export default function AnalyticsPage() {
  const { branch } = useAuth();
  const supabase = createClient();

  const { data, isLoading } = useQuery({
    queryKey: ["analytics", branch?.id],
    queryFn: async () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [ordersRes, itemsRes, feedbackRes] = await Promise.all([
        supabase
          .from("orders")
          .select("id, total, status, order_type, created_at")
          .eq("branch_id", branch!.id)
          .gte("created_at", thirtyDaysAgo.toISOString()),
        supabase
          .from("order_items")
          .select("dish_name, quantity, price_at_order, created_at")
          .eq("branch_id", branch!.id)
          .gte("created_at", thirtyDaysAgo.toISOString()),
        supabase
          .from("feedback")
          .select("rating")
          .eq("branch_id", branch!.id)
          .gte("created_at", thirtyDaysAgo.toISOString()),
      ]);

      const orders = (ordersRes.data || []) as any[];
      const items = (itemsRes.data || []) as any[];
      const feedback = (feedbackRes.data || []) as any[];

      // Revenue by day (last 14 days)
      const dailyRevenue: Record<string, number> = {};
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        dailyRevenue[d.toISOString().slice(5, 10)] = 0;
      }
      orders.forEach((o) => {
        const key = o.created_at.slice(5, 10);
        if (dailyRevenue[key] !== undefined) dailyRevenue[key] += Number(o.total) || 0;
      });
      const revenueChart = Object.entries(dailyRevenue).map(([day, amount]) => ({ day, amount: Math.round(amount) }));

      // Top 5 dishes
      const dishMap: Record<string, { name: string; qty: number; revenue: number }> = {};
      items.forEach((i) => {
        if (!dishMap[i.dish_name]) dishMap[i.dish_name] = { name: i.dish_name, qty: 0, revenue: 0 };
        dishMap[i.dish_name].qty += i.quantity;
        dishMap[i.dish_name].revenue += i.quantity * Number(i.price_at_order);
      });
      const topDishes = Object.values(dishMap).sort((a, b) => b.qty - a.qty).slice(0, 5);

      // Order type breakdown
      const typeMap: Record<string, number> = {};
      orders.forEach((o) => {
        typeMap[o.order_type] = (typeMap[o.order_type] || 0) + 1;
      });
      const orderTypes = Object.entries(typeMap).map(([name, value]) => ({ name, value }));

      // Peak hours
      const hourMap: Record<number, number> = {};
      orders.forEach((o) => {
        const h = new Date(o.created_at).getHours();
        hourMap[h] = (hourMap[h] || 0) + 1;
      });
      const peakHours = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}:00`, orders: hourMap[h] || 0 })).filter((h) => h.orders > 0);

      // Stats
      const totalRevenue = orders.reduce((s, o) => s + (Number(o.total) || 0), 0);
      const totalOrders = orders.length;
      const avgRating = feedback.length ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1) : "N/A";

      return { revenueChart, topDishes, orderTypes, peakHours, totalRevenue, totalOrders, avgRating, totalDishes: Object.keys(dishMap).length };
    },
    enabled: !!branch,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-4 gap-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-20" />)}</div>
        <div className="grid grid-cols-2 gap-3"><Skeleton className="h-56" /><Skeleton className="h-56" /></div>
      </div>
    );
  }

  const stats = [
    { label: "Revenue (30d)", value: formatCurrency(data?.totalRevenue || 0), icon: TrendingUp },
    { label: "Orders (30d)", value: data?.totalOrders || 0, icon: ShoppingBag },
    { label: "Unique Dishes", value: data?.totalDishes || 0, icon: Clock },
    { label: "Avg Rating", value: data?.avgRating || "N/A", icon: Star },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold font-poppins">Analytics</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="card-hover border-zinc-200 dark:border-zinc-800">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-md bg-teal-50 dark:bg-teal-950 flex items-center justify-center">
                  <s.icon className="h-3.5 w-3.5 text-teal-500" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500">{s.label}</p>
                  <p className="text-sm font-bold">{s.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Revenue Trend */}
        <Card className="card-hover border-zinc-200 dark:border-zinc-800">
          <CardContent className="p-4">
            <h3 className="text-xs font-semibold mb-3">Revenue Trend (14 days)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data?.revenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="day" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip formatter={(v: any) => formatCurrency(Number(v))} labelStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="amount" stroke={TEAL} strokeWidth={2} dot={{ r: 2, fill: TEAL }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Dishes */}
        <Card className="card-hover border-zinc-200 dark:border-zinc-800">
          <CardContent className="p-4">
            <h3 className="text-xs font-semibold mb-3">Top 5 Dishes (by quantity)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data?.topDishes} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 9 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={80} />
                <Tooltip formatter={(v: any) => v} labelStyle={{ fontSize: 10 }} />
                <Bar dataKey="qty" fill={TEAL} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Order Type Breakdown */}
        <Card className="card-hover border-zinc-200 dark:border-zinc-800">
          <CardContent className="p-4">
            <h3 className="text-xs font-semibold mb-3">Order Types</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data?.orderTypes} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`} labelLine={false} fontSize={9}>
                  {data?.orderTypes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Peak Hours */}
        <Card className="card-hover border-zinc-200 dark:border-zinc-800">
          <CardContent className="p-4">
            <h3 className="text-xs font-semibold mb-3">Peak Hours</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data?.peakHours}>
                <XAxis dataKey="hour" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip labelStyle={{ fontSize: 10 }} />
                <Bar dataKey="orders" fill={TEAL} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
