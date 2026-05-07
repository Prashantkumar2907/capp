"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/helpers";
import { SectionHeader } from "@/components/common/section-header";
import { StatCard } from "@/components/common/stat-card";
import { EmptyState } from "@/components/common/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  IndianRupee, CreditCard, Clock, CheckCircle2, XCircle,
  TrendingUp, Smartphone, Banknote, Filter,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

const METHOD_ICONS: Record<string, React.ReactNode> = {
  upi: <Smartphone className="h-4.5 w-4.5" />,
  razorpay: <CreditCard className="h-4.5 w-4.5" />,
  cash: <Banknote className="h-4.5 w-4.5" />,
  card: <CreditCard className="h-4.5 w-4.5" />,
};

const METHOD_COLORS: Record<string, string> = {
  upi: "bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400",
  razorpay: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  cash: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
  card: "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400",
};

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
  refunded: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
};

const PIE_COLORS = ["#8b5cf6", "#3b82f6", "#22c55e", "#f97316"];

type FilterStatus = "all" | "completed" | "pending" | "failed" | "refunded";
type FilterMethod = "all" | "upi" | "razorpay" | "cash" | "card";

export default function PaymentsPage() {
  const { branch } = useAuth();
  const [supabase] = useState(() => createClient());
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [methodFilter, setMethodFilter] = useState<FilterMethod>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["payments", branch?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("payments")
        .select("*, orders(order_number, table_number)")
        .eq("branch_id", branch!.id)
        .order("created_at", { ascending: false })
        .limit(200);
      return data || [];
    },
    enabled: !!branch,
  });

  const stats = useMemo(() => {
    if (!data) return { collected: 0, pending: 0, failed: 0, total: 0 };
    return {
      collected: data.filter(p => p.status === "completed").reduce((s, p) => s + Number(p.amount), 0),
      pending: data.filter(p => p.status === "pending").reduce((s, p) => s + Number(p.amount), 0),
      failed: data.filter(p => p.status === "failed").length,
      total: data.length,
    };
  }, [data]);

  const methodBreakdown = useMemo(() => {
    if (!data) return [];
    const methods = ["upi", "razorpay", "cash", "card"] as const;
    return methods
      .map((method) => {
        const items = data.filter(p => p.method === method && p.status === "completed");
        return { name: method.toUpperCase(), value: items.reduce((s, p) => s + Number(p.amount), 0), count: items.length };
      })
      .filter(m => m.count > 0);
  }, [data]);

  // Group by day for bar chart (last 7 days)
  const dailyTrend = useMemo(() => {
    if (!data) return [];
    const days: Record<string, number> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      days[d.toLocaleDateString("en-IN", { month: "short", day: "numeric" })] = 0;
    }
    data.filter(p => p.status === "completed").forEach(p => {
      const d = new Date(p.created_at);
      const key = d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      if (key in days) days[key] += Number(p.amount);
    });
    return Object.entries(days).map(([date, amount]) => ({ date, amount }));
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter(p => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (methodFilter !== "all" && p.method !== methodFilter) return false;
      return true;
    });
  }, [data, statusFilter, methodFilter]);

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Payments"
        description={`${data?.length || 0} transactions`}
        badge="Finance"
        actions={
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
              className="text-xs h-8 rounded-lg border border-border bg-background px-2 pr-7 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value as FilterMethod)}
              className="text-xs h-8 rounded-lg border border-border bg-background px-2 pr-7 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All methods</option>
              <option value="upi">UPI</option>
              <option value="razorpay">Razorpay</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
            </select>
          </div>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Collected" value={stats.collected} prefix="₹" icon={CheckCircle2} delay={0} />
        <StatCard label="Pending" value={stats.pending} prefix="₹" icon={Clock} delay={1} />
        <StatCard label="Failed" value={stats.failed} icon={XCircle} delay={2} />
        <StatCard label="Total Txns" value={stats.total} icon={TrendingUp} delay={3} />
      </div>

      {/* Charts row */}
      {!isLoading && (methodBreakdown.length > 0 || dailyTrend.some(d => d.amount > 0)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Payment methods breakdown */}
          {methodBreakdown.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Payment Methods</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width={120} height={120}>
                      <PieChart>
                        <Pie data={methodBreakdown} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3}>
                          {methodBreakdown.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v: unknown) => formatCurrency(Number(v))}
                          contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-2">
                      {methodBreakdown.map((m, i) => (
                        <div key={m.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="text-xs text-muted-foreground">{m.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-semibold">{formatCurrency(m.value)}</span>
                            <span className="text-[10px] text-muted-foreground ml-1">({m.count})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* 7-day trend */}
          {dailyTrend.some(d => d.amount > 0) && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">7-Day Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={dailyTrend} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} className="text-muted-foreground" tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 9 }} className="text-muted-foreground" tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(v: unknown) => [formatCurrency(Number(v)), "Revenue"]}
                        contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)" }}
                      />
                      <Bar dataKey="amount" className="fill-primary" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      )}

      {/* Transaction list */}
      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : filtered && filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((payment, i) => (
            <motion.div
              key={payment.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.015, duration: 0.25 }}
            >
              <Card className="card-hover">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${METHOD_COLORS[payment.method] || "bg-muted text-muted-foreground"}`}>
                    {METHOD_ICONS[payment.method] ?? <IndianRupee className="h-4.5 w-4.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">
                        #{(payment as any).orders?.order_number || "—"}
                      </span>
                      {(payment as any).orders?.table_number && (
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">
                          Table {(payment as any).orders.table_number}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">
                      {payment.method} · {new Date(payment.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <Badge className={`text-[10px] h-5 capitalize border-0 ${STATUS_COLORS[payment.status]}`}>
                    {payment.status}
                  </Badge>
                  <span className="text-sm font-bold shrink-0 tabular-nums">
                    {formatCurrency(Number(payment.amount))}
                  </span>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {filtered.length < (data?.length ?? 0) && (
            <p className="text-center text-xs text-muted-foreground py-2">
              Showing {filtered.length} of {data?.length} transactions
            </p>
          )}
        </div>
      ) : (
        <EmptyState
          icon={CreditCard}
          title={statusFilter !== "all" || methodFilter !== "all" ? "No matching payments" : "No payments yet"}
          description={
            statusFilter !== "all" || methodFilter !== "all"
              ? "Try adjusting the filters above"
              : "Payments will appear here as orders are completed"
          }
          actionLabel={statusFilter !== "all" || methodFilter !== "all" ? "Clear filters" : undefined}
          onAction={statusFilter !== "all" || methodFilter !== "all" ? () => { setStatusFilter("all"); setMethodFilter("all"); } : undefined}
        />
      )}
    </div>
  );
}
