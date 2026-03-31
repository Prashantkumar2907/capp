"use client";

import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDateShort } from "@/lib/helpers";
import { PAYMENT_STATUS, PAYMENT_METHODS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { CreditCard, IndianRupee, QrCode, Banknote } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-zinc-100 text-zinc-600",
};

const METHOD_ICONS: Record<string, React.ElementType> = {
  upi: QrCode,
  razorpay: CreditCard,
  cash: Banknote,
  card: CreditCard,
};

export default function PaymentsPage() {
  const { branch } = useAuth();
  const supabase = createClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");

  const { data: payments, isLoading } = useQuery({
    queryKey: ["payments", branch?.id, statusFilter, methodFilter],
    queryFn: async () => {
      let query = supabase
        .from("payments")
        .select("*, orders(order_number, table_number)")
        .eq("branch_id", branch!.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      if (methodFilter !== "all") query = query.eq("method", methodFilter);

      const { data } = await query;
      return data || [];
    },
    enabled: !!branch,
  });

  const completed = payments?.filter(p => p.status === "completed") || [];
  const totalCollected = completed.reduce((s, p) => s + (Number(p.amount) || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-poppins">Payments</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {formatCurrency(totalCollected)} collected · {completed.length} completed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v || 'all')}>
            <SelectTrigger className="h-8 text-xs w-28">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Status</SelectItem>
              {Object.entries(PAYMENT_STATUS).map(([k, v]) => (
                <SelectItem key={k} value={v} className="text-xs">{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={methodFilter} onValueChange={(v: any) => setMethodFilter(v || 'all')}>
            <SelectTrigger className="h-8 text-xs w-28">
              <SelectValue placeholder="Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Methods</SelectItem>
              {Object.entries(PAYMENT_METHODS).map(([k, v]) => (
                <SelectItem key={k} value={v} className="text-xs">{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-14" />)}</div>
      ) : payments?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
          <IndianRupee className="h-10 w-10 mb-2" />
          <p className="text-sm">No payments found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {payments?.map((p) => {
            const Icon = METHOD_ICONS[p.method] || CreditCard;
            return (
              <Card key={p.id} className="border-zinc-200 dark:border-zinc-800">
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-teal-50 dark:bg-teal-950 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-teal-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {formatCurrency(Number(p.amount))}
                        </span>
                        <Badge className={`text-[9px] h-4 px-1.5 ${STATUS_COLORS[p.status] || ""}`}>
                          {PAYMENT_STATUS[p.status as keyof typeof PAYMENT_STATUS] || p.status}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-zinc-500">
                        Order #{(p as any).orders?.order_number || "—"} · Table {(p as any).orders?.table_number || "—"} · {PAYMENT_METHODS[p.method as keyof typeof PAYMENT_METHODS] || p.method} · {formatDateShort(p.created_at)}
                      </p>
                    </div>
                  </div>
                  {p.transaction_id && (
                    <span className="text-[9px] text-zinc-400 font-mono">{p.transaction_id.slice(0, 12)}…</span>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
