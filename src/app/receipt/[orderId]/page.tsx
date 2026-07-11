"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, ExternalLink, ReceiptText, Star, Table2, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { OrderStatusBadge } from "@/components/shared/status-badge";
import { OrderProgress } from "@/components/features/orders/order-progress";
import { printBill } from "@/lib/print-bill";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDateTime, upiLink } from "@/lib/utils";
import type { Branch, Order, OrderItem, Payment } from "@/types/database";

type ReceiptOrder = Order & {
  order_items: OrderItem[];
  payments: Payment[];
  branches: (Branch & { organizations: { name: string; default_tax_percent: number; tax_inclusive: boolean; gst_number?: string | null; fssai_license?: string | null; gst_scheme?: "regular" | "composition"; service_charge_percent?: number } | null }) | null;
};

export default function ReceiptPage() {
  const params = useParams<{ orderId: string }>();
  const orderId = safeParam(params.orderId);
  const supabase = createClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const receipt = useQuery({
    queryKey: ["receipt", orderId],
    queryFn: async () => {
      const response = await fetch(`/api/public/receipt?orderId=${orderId}`);
      const payload = (await response.json()) as { error?: string; order?: ReceiptOrder };
      if (!response.ok || !payload.order) throw new Error(payload.error ?? "Receipt not found");
      return payload.order;
    },
    enabled: !!orderId,
    refetchInterval: (query) => { const s = query.state.data?.status; return s && ["served","cancelled"].includes(s) ? 60000 : 8000; },
  });

  const feedback = useMutation({
    mutationFn: async () => {
      const order = receipt.data;
      if (!order) return;
      const { error } = await supabase.from("feedback").insert({
        order_id: order.id,
        branch_id: order.branch_id,
        rating,
        comment: comment || null,
      });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Thank you for the feedback"),
    onError: (error) => toast.error(error.message),
  });

  if (receipt.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </main>
    );
  }

  if (receipt.error || !receipt.data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <ReceiptText className="mx-auto h-10 w-10 text-muted-foreground" />
            <h1 className="mt-3 text-lg font-semibold">Receipt not found</h1>
            <p className="mt-1 text-sm text-muted-foreground">{receipt.error?.message ?? "This order could not be loaded."}</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  const order = receipt.data;
  const payment = order.payments[0];
  const branch = order.branches;
  const upiHref =
    branch?.upi_vpa && payment
      ? upiLink({ vpa: branch.upi_vpa, amount: Number(payment.amount), reference: order.order_number, merchant: branch.organizations?.name ?? branch.name })
      : null;

  return (
    <main className="min-h-screen bg-background px-4 py-5">
      <div className="mx-auto max-w-2xl space-y-4">
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">{branch?.organizations?.name ?? "CAPP"}</p>
                <h1 className="font-numbers mt-1 text-xl font-semibold">#{order.order_number}</h1>
                <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(order.created_at)}</p>
                {order.invoice_number ? (
                  <p className="font-numbers mt-1 text-xs font-medium">Invoice {order.invoice_number}</p>
                ) : null}
                {branch?.organizations?.gst_number ? (
                  <p className="mt-1 text-[0.65rem] text-muted-foreground">GSTIN {branch.organizations.gst_number}</p>
                ) : null}
                {branch?.organizations?.fssai_license ? (
                  <p className="text-[0.65rem] text-muted-foreground">FSSAI Lic. {branch.organizations.fssai_license}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-full border bg-card p-2 text-muted-foreground transition-colors hover:text-foreground print:hidden"
                  aria-label="Print or save bill"
                  title="Print / save bill"
                >
                  <Printer className="h-4 w-4" />
                </button>
                <OrderStatusBadge status={order.status} />
              </div>
            </div>
            <OrderProgress status={order.status} />
            <div className="grid gap-3 sm:grid-cols-3">
              <MiniStat icon={Table2} label="Table" value={order.table_number ? String(order.table_number) : "Takeaway"} />
              <MiniStat icon={Clock} label="Status" value={order.status} />
              <MiniStat icon={CheckCircle2} label="Payment" value={payment?.status ?? "pending"} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3 p-5">
            <h2 className="text-sm font-semibold">Items</h2>
            {order.order_items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 rounded-2xl bg-secondary p-3">
                <div>
                  <p className="text-sm font-medium">
                    {item.dish_name}
                    {item.variant_name ? <span className="text-muted-foreground"> · {item.variant_name}</span> : null}
                  </p>
                  {Array.isArray(item.addons) && item.addons.length ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">+ {(item.addons as { name: string }[]).map((addon) => addon.name).join(", ")}</p>
                  ) : null}
                  {item.notes ? <p className="mt-1 text-xs text-muted-foreground">{item.notes}</p> : null}
                </div>
                <div className="text-right">
                  <p className="font-numbers text-sm font-semibold">{formatCurrency((Number(item.price_at_order) + Number(item.addon_total ?? 0)) * item.quantity)}</p>
                  <p className="font-numbers text-xs text-muted-foreground">x{item.quantity}</p>
                </div>
              </div>
            ))}
            <div className="space-y-2 border-t pt-3 text-sm">
              <Line label="Subtotal" value={formatCurrency(order.subtotal)} />
              {Number(order.service_charge ?? 0) > 0 ? (
                <Line label="Service charge (voluntary)" value={formatCurrency(Number(order.service_charge))} />
              ) : null}
              {Number(order.tax) > 0 ? (
                <>
                  <Line label={`CGST @ ${(Number(branch?.organizations?.default_tax_percent ?? 5) / 2).toFixed(2)}%`} value={formatCurrency(Number(order.tax) / 2)} />
                  <Line label={`SGST @ ${(Number(branch?.organizations?.default_tax_percent ?? 5) / 2).toFixed(2)}%`} value={formatCurrency(Number(order.tax) / 2)} />
                </>
              ) : null}
              {Number(order.discount) > 0 ? <Line label="Discount" value={formatCurrency(order.discount)} /> : null}
              <Line label="Total" value={formatCurrency(order.total)} strong />
              {branch?.organizations?.gst_scheme === "composition" ? (
                <p className="pt-1 text-[0.65rem] text-muted-foreground">
                  Composition taxable person, not eligible to collect tax on supplies.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
        {payment?.status !== "completed" && upiHref ? (
          <Card>
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold">Payment pending</h2>
                <p className="text-xs text-muted-foreground">Use UPI now or pay at the cashier desk.</p>
              </div>
              <a href={upiHref}>
                <Button>
                  <ExternalLink className="h-4 w-4" />
                  Pay UPI
                </Button>
              </a>
            </CardContent>
          </Card>
        ) : null}
        <Card>
          <CardContent className="space-y-4 p-5">
            <div>
              <h2 className="text-sm font-semibold">How was the experience?</h2>
              <p className="text-xs text-muted-foreground">Your feedback helps the restaurant improve service.</p>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button key={value} className={`flex h-10 w-10 items-center justify-center rounded-full border ${rating >= value ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`} onClick={() => setRating(value)} aria-label={`${value} stars`}>
                  <Star className="h-4 w-4" />
                </button>
              ))}
            </div>
            <Textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Leave a short note optional" />
            <Button disabled={feedback.isPending} onClick={() => feedback.mutate()}>
              Send feedback
            </Button>
          </CardContent>
        </Card>
        {order.table_number ? (
          <div className="text-center">
            <Link href={`/order/${order.branch_id}/${order.table_number}`}>
              <Button variant="ghost">Order more</Button>
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-secondary p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1 text-sm font-semibold capitalize">{value.replace("_", " ")}</p>
    </div>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "text-base font-semibold" : "text-muted-foreground"}`}>
      <span>{label}</span>
      <span className="font-numbers text-foreground">{value}</span>
    </div>
  );
}

function safeParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}
