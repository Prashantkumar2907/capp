"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Banknote, CheckCircle2, CreditCard, ExternalLink, IndianRupee, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { readApiResponse } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDateTime, upiLink } from "@/lib/utils";
import { operationalListFetchLimit } from "@/lib/constants";
import { usePagination } from "@/hooks/use-pagination";
import { useAuth } from "@/features/auth/auth-provider";
import type { Order, Payment } from "@/types/database";

type PaymentRow = Payment & { orders: Pick<Order, "order_number" | "table_number" | "customer_name" | "total" | "status"> | null };
type PaymentStatusFilter = "all" | Payment["status"];

export default function PaymentsPage() {
  const { branch, organization } = useAuth();
  const [supabase] = useState(() => createClient());
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PaymentStatusFilter>("all");

  const payments = useQuery({
    queryKey: ["payments", branch?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, orders(order_number, table_number, customer_name, total, status)")
        .eq("branch_id", branch!.id)
        .order("created_at", { ascending: false })
        .limit(operationalListFetchLimit);
      if (error) throw error;
      return (data ?? []) as PaymentRow[];
    },
    enabled: !!branch,
    refetchInterval: 30000,
  });

  const updatePayment = useMutation({
    mutationFn: async ({ payment, nextStatus }: { payment: PaymentRow; nextStatus: "completed" | "failed" }) => {
      const response = await fetch(`/api/payments/${payment.id}/settle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      await readApiResponse(response);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["payments"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
      ]);
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

  const pagination = usePagination(filtered, 8);
  const { setPage } = pagination;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Payments"
        description="Cashier desk for UPI, cash, card, and Razorpay settlements."
        actions={
          <Button variant="secondary" onClick={() => void payments.refetch()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Collected" value={formatCurrency(stats.collected)} icon={IndianRupee} tone="success" />
        <StatCard label="Pending" value={formatCurrency(stats.pending)} icon={Banknote} tone="warning" />
        <StatCard label="Failed" value={stats.failed} icon={CreditCard} tone="info" />
        <StatCard label="Loaded records" value={stats.count} icon={CheckCircle2} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-64 flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search payment"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as PaymentStatusFilter);
            setPage(1);
          }}
          className="w-48"
        >
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
        <>
          <div className="space-y-2">
            {pagination.pageItems.map((payment) => {
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
                        <Button
                          size="sm"
                          disabled={updatePayment.isPending}
                          onClick={() => {
                            if (window.confirm(`Mark payment ${payment.orders?.order_number ?? payment.id.slice(0, 8)} as paid?`)) {
                              updatePayment.mutate({ payment, nextStatus: "completed" });
                            }
                          }}
                        >
                          Mark paid
                        </Button>
                      ) : null}
                      {payment.status === "pending" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={updatePayment.isPending}
                          onClick={() => {
                            if (window.confirm("Mark this pending payment as failed?")) updatePayment.mutate({ payment, nextStatus: "failed" });
                          }}
                        >
                          Mark failed
                        </Button>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <Pagination
            page={pagination.currentPage}
            pageSize={pagination.pageSize}
            totalItems={pagination.totalItems}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
          />
        </>
      ) : (
        <EmptyState icon={CreditCard} title="No payments found" description="Payments are created automatically when orders are placed." />
      )}
    </div>
  );
}

function PaymentBadge({ status }: { status: Payment["status"] }) {
  const variant = status === "completed" ? "success" : status === "pending" ? "warning" : status === "failed" ? "destructive" : "secondary";
  return <Badge variant={variant}>{status}</Badge>;
}
