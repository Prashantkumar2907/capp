"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/helpers";
import { PAYMENT_STATUS, ORDER_STATUS_LABELS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Receipt, Star, CheckCircle2, Loader2 } from "lucide-react";

type OrderData = {
  id: string;
  order_number: string;
  table_number: number | null;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  notes: string | null;
  created_at: string;
  items: { dish_name: string; quantity: number; price_at_order: number }[];
  payment: { status: string; method: string } | null;
  branch: { name: string; org_name: string };
};

export default function ReceiptPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const supabase = createClient();

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [sendingFeedback, setSendingFeedback] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: o } = await supabase
        .from("orders")
        .select("id, order_number, table_number, status, subtotal, tax, total, notes, created_at, branch_id, branches(name, organizations(name))")
        .eq("id", orderId)
        .single();

      if (!o) { setLoading(false); return; }

      const { data: items } = await supabase
        .from("order_items")
        .select("dish_name, quantity, price_at_order")
        .eq("order_id", orderId);

      const { data: payment } = await supabase
        .from("payments")
        .select("status, method")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const { data: existingFeedback } = await supabase
        .from("feedback")
        .select("id")
        .eq("order_id", orderId)
        .limit(1);

      if (existingFeedback && existingFeedback.length > 0) setFeedbackSent(true);

      setOrder({
        id: o.id,
        order_number: o.order_number,
        table_number: o.table_number,
        status: o.status,
        subtotal: Number(o.subtotal),
        tax: Number(o.tax),
        total: Number(o.total),
        notes: o.notes,
        created_at: o.created_at,
        items: items || [],
        payment: payment || null,
        branch: {
          name: (o as any).branches?.name || "",
          org_name: (o as any).branches?.organizations?.name || "",
        },
      });
      setLoading(false);
    }
    load();
  }, [orderId, supabase]);

  const submitFeedback = async () => {
    if (rating === 0) { toast.error("Please select a rating"); return; }
    setSendingFeedback(true);
    const { error } = await supabase.from("feedback").insert({
      order_id: orderId,
      branch_id: order?.id ? (await supabase.from("orders").select("branch_id").eq("id", orderId).single()).data?.branch_id : null,
      rating,
      comment: comment || null,
    });
    if (error) toast.error(error.message);
    else { setFeedbackSent(true); toast.success("Thank you for your feedback!"); }
    setSendingFeedback(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
        <Skeleton className="h-96 w-80" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
        <p className="text-sm text-zinc-500">Order not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
      <Card className="max-w-sm w-full border-zinc-200 dark:border-zinc-800">
        <CardContent className="p-5">
          {/* Header */}
          <div className="text-center mb-4">
            <div className="h-10 w-10 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center mx-auto mb-2">
              <Receipt className="h-5 w-5 text-teal-500" />
            </div>
            <h1 className="font-bold font-poppins">{order.branch.org_name}</h1>
            <p className="text-[10px] text-zinc-500">{order.branch.name} · Table {order.table_number || "—"}</p>
            <p className="text-[10px] text-zinc-400">#{order.order_number} · {formatDate(order.created_at)}</p>
          </div>

          {/* Status */}
          <div className="flex justify-center gap-2 mb-4">
            <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300 text-[10px]">
              {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] || order.status}
            </Badge>
            {order.payment && (
              <Badge className={`text-[10px] ${order.payment.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                {PAYMENT_STATUS[order.payment.status as keyof typeof PAYMENT_STATUS]} · {order.payment.method.toUpperCase()}
              </Badge>
            )}
          </div>

          <Separator className="mb-3" />

          {/* Items */}
          <div className="space-y-1.5 mb-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span>{item.quantity}× {item.dish_name}</span>
                <span>{formatCurrency(Number(item.price_at_order) * item.quantity)}</span>
              </div>
            ))}
          </div>

          <Separator className="mb-3" />

          {/* Totals */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-zinc-500">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.tax > 0 && (
              <div className="flex justify-between text-xs text-zinc-500">
                <span>Tax</span>
                <span>{formatCurrency(order.tax)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-sm font-bold">
              <span>Total</span>
              <span className="text-teal-600">{formatCurrency(order.total)}</span>
            </div>
          </div>

          {/* Feedback */}
          <div className="mt-6 pt-4 border-t">
            {feedbackSent ? (
              <div className="text-center">
                <CheckCircle2 className="h-6 w-6 text-teal-500 mx-auto mb-1" />
                <p className="text-xs text-zinc-500">Thanks for your feedback!</p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-medium text-center mb-2">Rate your experience</p>
                <div className="flex justify-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button key={s} onClick={() => setRating(s)} className="focus:outline-none">
                      <Star className={`h-6 w-6 transition-colors ${s <= rating ? "fill-teal-500 text-teal-500" : "text-zinc-300"}`} />
                    </button>
                  ))}
                </div>
                <Textarea
                  className="text-xs min-h-[50px] mb-2"
                  placeholder="Any comments? (optional)"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                />
                <Button
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white h-8 text-xs"
                  onClick={submitFeedback}
                  disabled={sendingFeedback}
                >
                  {sendingFeedback && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                  Submit Feedback
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
