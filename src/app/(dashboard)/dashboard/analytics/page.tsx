"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/hooks/use-supabase";
import { formatCurrency } from "@/lib/helpers";
import { SectionHeader } from "@/components/common/section-header";
import { StatCard } from "@/components/common/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp, ShoppingBag, IndianRupee, Star, Clock,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { motion } from "framer-motion";

const COLORS = ["#14b8a6", "#0d9488", "#2dd4bf", "#5eead4", "#99f6e4"];
const PERIODS = [
  { value: 1, label: "Today" },
  { value: 7, label: "7 Days" },
  { value: 30, label: "30 Days" },
  { value: 90, label: "90 Days" },
];

export default function AnalyticsPage() {
  const { branch } = useAuth();
  const supabase = useSupabase();
  const [period, setPeriod] = useState(7);

  const { data, isLoading } = useQuery({
    queryKey: ["analytics", branch?.id, period],
    queryFn: async () => {
      const since = new Date(Date.now() - period * 24 * 60 * 60 * 1000).toISOString();
      const [ordersRes, feedbackRes, itemsRes] = await Promise.all([
        supabase.from("orders").select("id, total, status, order_type, created_at").eq("branch_id", branch!.id).gte("created_at", since),
        supabase.from("feedback").select("rating").eq("branch_id", branch!.id).gte("created_at", since),
        supabase.from("order_items").select("dish_name, quantity, price_at_order").eq("branch_id", branch!.id).gte("created_at", since),
      ]);

      const orders = ordersRes.data || [];
      const feedback = feedbackRes.data || [];
      const items = itemsRes.data || [];

      const revenue = orders.reduce((s, o) => s + (Number(o.total) || 0), 0);
      const orderCount = orders.length;
      const avgOrderValue = orderCount > 0 ? revenue / orderCount : 0;
      const avgRating = feedback.length ? feedback.reduce((s, f) => s + f.rating, 0) / feedback.length : 0;

      // Daily revenue
      const dailyMap: Record<string, number> = {};
      for (let i = Math.min(period, 30) - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        dailyMap[d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })] = 0;
      }
      orders.forEach(o => {
        const key = new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
        if (dailyMap[key] !== undefined) dailyMap[key] += Number(o.total) || 0;
      });
      const revenueChart = Object.entries(dailyMap).map(([day, amount]) => ({ day, amount: Math.round(amount) }));

      // Top dishes
      const dishMap: Record<string, { qty: number; revenue: number }> = {};
      items.forEach(i => {
        if (!dishMap[i.dish_name]) dishMap[i.dish_name] = { qty: 0, revenue: 0 };
        dishMap[i.dish_name].qty += i.quantity;
        dishMap[i.dish_name].revenue += i.quantity * Number(i.price_at_order);
      });
      const topDishes = Object.entries(dishMap).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.qty - a.qty).slice(0, 8);

      // Order type breakdown
      const typeMap: Record<string, number> = {};
      orders.forEach(o => { const t = o.order_type === "dine_in" ? "Dine-in" : o.order_type === "takeaway" ? "Takeaway" : "Delivery"; typeMap[t] = (typeMap[t] || 0) + 1; });
      const orderTypes = Object.entries(typeMap).map(([name, value]) => ({ name, value }));

      // Peak hours
      const hourMap: number[] = Array(24).fill(0);
      orders.forEach(o => { hourMap[new Date(o.created_at).getHours()]++; });
      const peakHours = hourMap.map((count, hour) => ({ hour: `${hour}:00`, count })).filter(h => h.count > 0);

      return { revenue, orderCount, avgOrderValue, avgRating, revenueChart, topDishes, orderTypes, peakHours };
    },
    enabled: !!branch,
  });

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Analytics"
        description="Track your restaurant's performance"
        actions={
          <div className="flex gap-1.5">
            {PERIODS.map(p => (
              <button key={p.value} onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${period === p.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Revenue" value={data?.revenue || 0} prefix="₹" icon={IndianRupee} delay={0} />
            <StatCard label="Orders" value={data?.orderCount || 0} icon={ShoppingBag} delay={1} />
            <StatCard label="Avg Order" value={data?.avgOrderValue || 0} prefix="₹" decimals={0} icon={TrendingUp} delay={2} />
            <StatCard label="Avg Rating" value={data?.avgRating || 0} decimals={1} suffix="/5" icon={Star} delay={3} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Revenue trend */}
            <Card><CardContent className="p-5">
              <h3 className="text-sm font-semibold mb-4">Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={data?.revenueChart}>
                  <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2} /><stop offset="95%" stopColor="#14b8a6" stopOpacity={0} /></linearGradient></defs>
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={50} tickFormatter={v => `₹${v}`} />
                  <Tooltip formatter={(v: unknown) => [`₹${Number(v).toLocaleString("en-IN")}`, "Revenue"]} contentStyle={{ fontSize: 11, borderRadius: 8, background: "var(--popover)", border: "1px solid var(--border)", color: "var(--popover-foreground)" }} />
                  <Area type="monotone" dataKey="amount" stroke="#14b8a6" strokeWidth={2} fill="url(#rev)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent></Card>

            {/* Top dishes */}
            <Card><CardContent className="p-5">
              <h3 className="text-sm font-semibold mb-4">Top Dishes</h3>
              {data?.topDishes && data.topDishes.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data.topDishes} layout="vertical" margin={{ left: 80 }}>
                    <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip formatter={(v: unknown) => [Number(v), "Quantity"]} contentStyle={{ fontSize: 11, borderRadius: 8, background: "var(--popover)", border: "1px solid var(--border)", color: "var(--popover-foreground)" }} />
                    <Bar dataKey="qty" fill="#14b8a6" radius={[0, 4, 4, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-60 flex items-center justify-center text-xs text-muted-foreground">No data</div>}
            </CardContent></Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Order types */}
            <Card><CardContent className="p-5">
              <h3 className="text-sm font-semibold mb-4">Order Types</h3>
              {data?.orderTypes && data.orderTypes.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}><PieChart>
                    <Pie data={data.orderTypes} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} strokeWidth={0}>
                      {data.orderTypes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, background: "var(--popover)", border: "1px solid var(--border)", color: "var(--popover-foreground)" }} />
                  </PieChart></ResponsiveContainer>
                  <div className="flex justify-center gap-4 mt-2">
                    {data.orderTypes.map((t, i) => (
                      <div key={t.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i] }} />{t.name} ({t.value})
                      </div>
                    ))}
                  </div>
                </>
              ) : <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">No data</div>}
            </CardContent></Card>

            {/* Peak hours */}
            <Card><CardContent className="p-5">
              <h3 className="text-sm font-semibold mb-4">Peak Hours</h3>
              {data?.peakHours && data.peakHours.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.peakHours}>
                    <XAxis dataKey="hour" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, background: "var(--popover)", border: "1px solid var(--border)", color: "var(--popover-foreground)" }} />
                    <Bar dataKey="count" fill="#14b8a6" radius={[4, 4, 0, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">No data</div>}
            </CardContent></Card>
          </div>
        </>
      )}
    </div>
  );
}
