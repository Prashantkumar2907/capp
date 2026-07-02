"use client";

import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/hooks/use-supabase";
import { formatCurrency, timeAgo } from "@/lib/helpers";
import { StatCard } from "@/components/common/stat-card";
import { EmptyState } from "@/components/common/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp, ShoppingBag, IndianRupee, Star, Clock,
  Plus, UtensilsCrossed, MapPin, ArrowRight,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Order } from "@/lib/supabase/types";

const COLORS = ["#14b8a6", "#0d9488", "#2dd4bf", "#5eead4", "#99f6e4"];

export default function DashboardPage() {
  const { branch, staff, organization } = useAuth();
  const supabase = useSupabase();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", branch?.id],
    queryFn: async () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [ordersRes, todayOrdersRes, feedbackRes] = await Promise.all([
        supabase
          .from("orders")
          .select("id, total, status, order_type, created_at")
          .eq("branch_id", branch!.id)
          .gte("created_at", sevenDaysAgo.toISOString()),
        supabase
          .from("orders")
          .select("id, total, order_number, table_number, status, created_at")
          .eq("branch_id", branch!.id)
          .gte("created_at", today.toISOString())
          .order("created_at", { ascending: false }),
        supabase
          .from("feedback")
          .select("rating")
          .eq("branch_id", branch!.id)
          .gte("created_at", sevenDaysAgo.toISOString()),
      ]);

      const allOrders = ordersRes.data || [];
      const todayOrders = todayOrdersRes.data || [];
      const feedback = feedbackRes.data || [];

      // Today stats
      const todayRevenue = todayOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);
      const todayCount = todayOrders.length;
      const avgOrderValue = todayCount > 0 ? todayRevenue / todayCount : 0;
      const avgRating = feedback.length
        ? feedback.reduce((s, f) => s + f.rating, 0) / feedback.length
        : 0;

      // Revenue chart (7 days)
      const dailyRevenue: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
        dailyRevenue[key] = 0;
      }
      allOrders.forEach((o) => {
        const d = new Date(o.created_at);
        const key = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
        if (dailyRevenue[key] !== undefined) dailyRevenue[key] += Number(o.total) || 0;
      });
      const revenueChart = Object.entries(dailyRevenue).map(([day, amount]) => ({
        day,
        amount: Math.round(amount),
      }));

      // Order type breakdown
      const typeMap: Record<string, number> = {};
      allOrders.forEach((o) => {
        const type = o.order_type === "dine_in" ? "Dine-in" : o.order_type === "takeaway" ? "Takeaway" : "Delivery";
        typeMap[type] = (typeMap[type] || 0) + 1;
      });
      const orderTypes = Object.entries(typeMap).map(([name, value]) => ({ name, value }));

      // Recent orders (last 5)
      const recentOrders = todayOrders.slice(0, 5);

      return {
        todayRevenue, todayCount, avgOrderValue, avgRating,
        revenueChart, orderTypes, recentOrders,
        weeklyRevenue: allOrders.reduce((s, o) => s + (Number(o.total) || 0), 0),
        weeklyOrders: allOrders.length,
      };
    },
    enabled: !!branch,
    refetchInterval: 30000,
  });

  const quickActions = [
    { label: "New Order", icon: Plus, href: "/dashboard/waiter", color: "bg-primary/10 text-primary" },
    { label: "Add Dish", icon: UtensilsCrossed, href: "/dashboard/menu", color: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400" },
    { label: "View Tables", icon: MapPin, href: "/dashboard/tables", color: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400" },
    { label: "Analytics", icon: TrendingUp, href: "/dashboard/analytics", color: "bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight">
          {getGreeting()}, {staff?.full_name?.split(" ")[0] || "there"} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Here&apos;s what&apos;s happening at {branch?.name || "your restaurant"} today.
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Today's Revenue"
          value={data?.todayRevenue || 0}
          prefix="₹"
          icon={IndianRupee}
          delay={0}
        />
        <StatCard
          label="Orders Today"
          value={data?.todayCount || 0}
          icon={ShoppingBag}
          delay={1}
        />
        <StatCard
          label="Avg Order Value"
          value={data?.avgOrderValue || 0}
          prefix="₹"
          decimals={0}
          icon={TrendingUp}
          delay={2}
        />
        <StatCard
          label="Avg Rating"
          value={data?.avgRating || 0}
          decimals={1}
          suffix="/5"
          icon={Star}
          delay={3}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <Card className="lg:col-span-2 border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold">Revenue Trend</h3>
                <p className="text-xs text-muted-foreground">Last 7 days</p>
              </div>
              <Badge variant="outline" className="text-xs">
                ₹{((data?.weeklyRevenue || 0)).toLocaleString("en-IN")}
              </Badge>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data?.revenueChart}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  formatter={(v: unknown) => [`₹${Number(v).toLocaleString("en-IN")}`, "Revenue"]}
                  contentStyle={{
                    fontSize: 12, borderRadius: 10,
                    background: "var(--popover)", border: "1px solid var(--border)",
                    color: "var(--popover-foreground)", boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
                  }}
                />
                <Area
                  type="monotone" dataKey="amount" stroke="#14b8a6" strokeWidth={2.5}
                  fill="url(#colorRevenue)" dot={false} activeDot={{ r: 4, fill: "#14b8a6" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Order types donut */}
        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold mb-1">Order Types</h3>
            <p className="text-xs text-muted-foreground mb-4">{data?.weeklyOrders || 0} total this week</p>
            {data?.orderTypes && data.orderTypes.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={data.orderTypes} dataKey="value" nameKey="name"
                      cx="50%" cy="50%" innerRadius={45} outerRadius={65}
                      paddingAngle={4} strokeWidth={0}
                    >
                      {data.orderTypes.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{
                      fontSize: 11, borderRadius: 8,
                      background: "var(--popover)", border: "1px solid var(--border)",
                      color: "var(--popover-foreground)",
                    }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2">
                  {data.orderTypes.map((t, i) => (
                    <div key={t.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span>{t.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-40 text-xs text-muted-foreground">No orders yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions + Recent orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quick Actions */}
        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <Link key={action.label} href={action.href}>
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 card-hover cursor-pointer transition-colors">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${action.color}`}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium">{action.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Recent Orders</h3>
              <Link href="/dashboard/orders">
                <Button variant="ghost" size="sm" className="text-xs h-7">
                  View all <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
            {data?.recentOrders && data.recentOrders.length > 0 ? (
              <div className="space-y-2">
                {data.recentOrders.map((order: Pick<Order, "id" | "order_number" | "table_number" | "status" | "created_at" | "total">, i: number) => {
                  const statusColors: Record<string, string> = {
                    pending: "border-amber-400/50 text-amber-600 dark:text-amber-400",
                    confirmed: "border-blue-400/50 text-blue-600 dark:text-blue-400",
                    preparing: "border-orange-400/50 text-orange-600 dark:text-orange-400",
                    ready: "border-green-400/50 text-green-600 dark:text-green-400",
                    served: "border-muted-foreground/30 text-muted-foreground",
                    cancelled: "border-red-400/50 text-red-600 dark:text-red-400",
                  };
                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-medium">#{order.order_number}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" /> {timeAgo(order.created_at)}
                            {order.table_number && ` · Table ${order.table_number}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold">{formatCurrency(Number(order.total))}</p>
                        <Badge variant="outline" className={`text-[9px] h-4 capitalize ${statusColors[order.status] || ""}`}>
                          {order.status}
                        </Badge>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={ShoppingBag}
                title="No orders today"
                description="Orders will appear here as they come in"
                className="py-8"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
