"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Banknote, CheckCircle2, CreditCard, ExternalLink, FileText, IndianRupee, Printer, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDateTime, upiLink } from "@/lib/utils";
import { useAuth } from "@/features/auth/auth-provider";
import type { Order, Payment } from "@/types/database";

type SettleMethod = "cash" | "upi" | "card";

type PaymentRow = Payment & { orders: Pick<Order, "order_number" | "table_number" | "customer_name" | "total" | "status"> | null };
type PaymentStatusFilter = "all" | Payment["status"];

export default function PaymentsPage() {
  const { branch, organization } = useAuth();
  const [supabase] = useState(() => createClient());
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PaymentStatusFilter>("all");
  const [settling, setSettling] = useState<PaymentRow | null>(null);
  const [settleMethod, setSettleMethod] = useState<SettleMethod>("cash");
  const [tendered, setTendered] = useState("");
  const [zOpen, setZOpen] = useState(false);

  const payments = useQuery({
    queryKey: ["payments", branch?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, orders(order_number, table_number, customer_name, total, status)")
        .eq("branch_id", branch!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PaymentRow[];
    },
    enabled: !!branch,
    refetchInterval: 30000,
  });

  const updatePayment = useMutation({
    mutationFn: async ({ payment, nextStatus, method }: { payment: PaymentRow; nextStatus: Payment["status"]; method?: SettleMethod }) => {
      const { error } = await supabase
        .from("payments")
        .update({
          status: nextStatus,
          ...(method ? { method } : {}),
          transaction_id: payment.transaction_id || `manual-${Date.now()}`,
        })
        .eq("id", payment.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Payment updated");
    },
    onError: (error) => toast.error(error.message),
  });

  const filtered = useMemo(() => {
    return (payments.data ?? []).filter((payment) => {
      const haystack = `${payment.orders?.order_number ?? ""} ${payment.orders?.customer_name ?? ""} ${payment.transaction_id ?? ""}`.toLowerCase();
      if (search && !haystack.includes(search.toLowerCase())) return false;
      if (status !== "all" && payment.status !== status) return false;
      return true;
    });
  }, [payments.data, search, status]);

  const stats = useMemo(() => {
    const rows = payments.data ?? [];
    return {
      collected: rows.filter((payment) => payment.status === "completed").reduce((sum, payment) => sum + Number(payment.amount), 0),
      pending: rows.filter((payment) => payment.status === "pending").reduce((sum, payment) => sum + Number(payment.amount), 0),
      failed: rows.filter((payment) => payment.status === "failed").length,
      count: rows.length,
    };
  }, [payments.data]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Payments"
        description="Cashier desk for UPI, cash, card, and Razorpay settlements."
        actions={
          <>
            <Button variant="secondary" onClick={() => setZOpen(true)}>
              <FileText className="h-4 w-4" />
              Day report
            </Button>
            <Button variant="secondary" onClick={() => void payments.refetch()}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Collected" value={formatCurrency(stats.collected)} icon={IndianRupee} tone="success" />
        <StatCard label="Pending" value={formatCurrency(stats.pending)} icon={Banknote} tone="warning" />
        <StatCard label="Failed" value={stats.failed} icon={CreditCard} tone="info" />
        <StatCard label="Total records" value={stats.count} icon={CheckCircle2} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-64 flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search payment" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <Select value={status} onChange={(event) => setStatus(event.target.value as PaymentStatusFilter)} className="w-48">
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </Select>
      </div>
      {payments.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-20" />
          ))}
        </div>
      ) : filtered.length ? (
        <div className="space-y-2">
          {filtered.map((payment) => {
            const upiHref =
              branch?.upi_vpa && payment.status === "pending"
                ? upiLink({ vpa: branch.upi_vpa, amount: Number(payment.amount), reference: payment.orders?.order_number ?? payment.id, merchant: organization?.name ?? branch.name })
                : null;
            return (
              <Card key={payment.id}>
                <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-numbers text-sm font-semibold">#{payment.orders?.order_number ?? payment.id.slice(0, 8)}</p>
                      <PaymentBadge status={payment.status} />
                      <Badge variant="secondary">{payment.method}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {payment.orders?.table_number ? `Table ${payment.orders.table_number} | ` : ""}
                      {payment.orders?.customer_name || "Walk-in"} | {formatDateTime(payment.created_at)}
                    </p>
                  </div>
                  <p className="font-numbers text-lg font-semibold">{formatCurrency(payment.amount)}</p>
                  <div className="flex flex-wrap gap-2">
                    {upiHref ? (
                      <a href={upiHref}>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-3.5 w-3.5" />
                          UPI
                        </Button>
                      </a>
                    ) : null}
                    {payment.status !== "completed" ? (
                      <Button size="sm" disabled={updatePayment.isPending} onClick={() => { setSettleMethod("cash"); setTendered(""); setSettling(payment); }}>
                        Settle
                      </Button>
                    ) : null}
                    {payment.status === "pending" ? (
                      <Button variant="ghost" size="sm" disabled={updatePayment.isPending} onClick={() => updatePayment.mutate({ payment, nextStatus: "failed" })}>
                        Mark failed
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={CreditCard} title="No payments found" description="Payments are created automatically when orders are placed." />
      )}

      {/* Settle dialog: method + cash change calculation */}
      <Dialog open={!!settling} title={`Settle #${settling?.orders?.order_number ?? ""}`} onOpenChange={(open) => !open && setSettling(null)}>
        {settling ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-2xl border bg-secondary p-3">
              <span className="text-sm">Amount due</span>
              <span className="font-numbers text-lg font-semibold">{formatCurrency(Number(settling.amount))}</span>
            </div>
            <div className="space-y-1.5">
              <Label>Payment method</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {(["cash", "upi", "card"] as SettleMethod[]).map((method) => (
                  <button key={method} type="button" onClick={() => setSettleMethod(method)} className={`rounded-xl border px-3 py-2 text-sm capitalize transition-colors ${settleMethod === method ? "border-primary bg-primary/10" : "bg-card hover:border-primary/40"}`}>
                    {method}
                  </button>
                ))}
              </div>
            </div>
            {settleMethod === "cash" ? (
              <div className="space-y-1.5">
                <Label>Cash received</Label>
                <Input type="number" inputMode="numeric" placeholder="500" value={tendered} onChange={(event) => setTendered(event.target.value)} />
                {Number(tendered) >= Number(settling.amount) ? (
                  <p className="rounded-xl bg-success/10 px-3 py-2 text-sm font-medium text-success">
                    Return change: {formatCurrency(Number(tendered) - Number(settling.amount))}
                  </p>
                ) : tendered ? (
                  <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    Short by {formatCurrency(Number(settling.amount) - Number(tendered))}
                  </p>
                ) : null}
              </div>
            ) : null}
            <Button
              className="w-full"
              size="lg"
              disabled={updatePayment.isPending || (settleMethod === "cash" && Number(tendered) < Number(settling.amount))}
              onClick={() => {
                updatePayment.mutate({ payment: settling, nextStatus: "completed", method: settleMethod });
                setSettling(null);
              }}
            >
              Confirm payment received
            </Button>
          </div>
        ) : null}
      </Dialog>

      {/* Z-report: day-end summary */}
      <Dialog open={zOpen} title="Day report" onOpenChange={setZOpen} className="max-w-md">
        <DaySummary payments={payments.data ?? []} />
      </Dialog>
    </div>
  );
}

/** Z-report: today's collections split by method, plus pending. Print-friendly. */
function DaySummary({ payments }: { payments: PaymentRow[] }) {
  const today = new Date();
  const isToday = (value: string) => {
    const date = new Date(value);
    return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
  };
  const rows = payments.filter((payment) => isToday(payment.created_at));
  const completed = rows.filter((payment) => payment.status === "completed");
  const byMethod = (method: Payment["method"]) => completed.filter((payment) => payment.method === method).reduce((sum, payment) => sum + Number(payment.amount), 0);
  const totals = {
    cash: byMethod("cash"),
    upi: byMethod("upi"),
    card: byMethod("card"),
    razorpay: byMethod("razorpay"),
    pending: rows.filter((payment) => payment.status === "pending").reduce((sum, payment) => sum + Number(payment.amount), 0),
  };
  const grand = totals.cash + totals.upi + totals.card + totals.razorpay;

  return (
    <div className="space-y-3" id="z-report">
      <p className="text-xs text-muted-foreground">{formatDateTime(today.toISOString())} · {completed.length} settled bills</p>
      <div className="space-y-2 rounded-2xl border p-3 text-sm">
        <ReportLine label="Cash in drawer" value={formatCurrency(totals.cash)} />
        <ReportLine label="UPI" value={formatCurrency(totals.upi)} />
        <ReportLine label="Card" value={formatCurrency(totals.card)} />
        {totals.razorpay > 0 ? <ReportLine label="Razorpay" value={formatCurrency(totals.razorpay)} /> : null}
        <div className="border-t pt-2">
          <ReportLine label="Total collected" value={formatCurrency(grand)} strong />
        </div>
        {totals.pending > 0 ? <ReportLine label="Still pending" value={formatCurrency(totals.pending)} /> : null}
      </div>
      <Button className="w-full" variant="secondary" onClick={() => window.print()}>
        <Printer className="h-4 w-4" />
        Print
      </Button>
    </div>
  );
}

function ReportLine({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${strong ? "font-semibold" : ""}`}>
      <span>{label}</span>
      <span className="font-numbers">{value}</span>
    </div>
  );
}

function PaymentBadge({ status }: { status: Payment["status"] }) {
  const variant = status === "completed" ? "success" : status === "pending" ? "warning" : status === "failed" ? "destructive" : "secondary";
  return <Badge variant={variant}>{status}</Badge>;
}
