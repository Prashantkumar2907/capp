"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/helpers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Receipt, Star, Send, Loader2, UtensilsCrossed, Share2 } from "lucide-react";

export default function ReceiptPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const [supabase] = useState(() => createClient());
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ["receipt", orderId],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*), branches(name, organizations(name))")
        .eq("id", orderId)
        .single();
      return data;
    },
  });

  const sendFeedback = useMutation({
    mutationFn: async () => {
      if (rating < 1) { toast.error("Please select a rating"); return; }
      const { error } = await supabase.from("feedback").insert({
        order_id: orderId,
        branch_id: order?.branch_id,
        rating,
        comment: comment || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setFeedbackSent(true);
      toast.success("Thank you for your feedback!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `Receipt #${order?.order_number}`,
        text: `Order total: ${formatCurrency(Number(order?.total))}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied!");
    }
  };

  if (isLoading || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const orgName = (order as any).branches?.organizations?.name || "Restaurant";
  const branchName = (order as any).branches?.name || "";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <Card className="border-border shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-primary/5 p-5 text-center border-b border-border">
            <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <UtensilsCrossed className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-lg font-bold">{orgName}</h1>
            <p className="text-xs text-muted-foreground">{branchName}</p>
          </div>

          <CardContent className="p-5 space-y-4">
            {/* Order info */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Order Number</p>
                <p className="text-sm font-bold text-primary">#{order.order_number}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="text-xs font-medium">
                  {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>

            {order.table_number && (
              <Badge variant="outline" className="text-xs">Table {order.table_number}</Badge>
            )}

            <Separator />

            {/* Items */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Items</h3>
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="flex-1">
                    <span className="font-medium">{item.quantity}×</span>{" "}
                    {item.dish_name}
                  </span>
                  <span className="font-medium shrink-0 ml-3">{formatCurrency(item.quantity * Number(item.price_at_order))}</span>
                </div>
              ))}
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(Number(order.subtotal))}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(Number(order.tax))}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-green-600">-{formatCurrency(Number(order.discount))}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(Number(order.total))}</span>
              </div>
            </div>

            {/* Status */}
            <div className="flex justify-center">
              <Badge className="text-xs capitalize">{order.status}</Badge>
            </div>

            <Separator />

            {/* Feedback */}
            {!feedbackSent ? (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-center">How was your experience?</h3>
                <div className="flex justify-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setRating(s)} className="p-1 transition-transform hover:scale-110">
                      <Star
                        className={`h-7 w-7 transition-colors ${s <= rating ? "fill-amber-400 text-amber-400" : "text-muted"}`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2">
                    <Textarea
                      className="text-xs min-h-[60px] rounded-xl"
                      placeholder="Tell us more (optional)..."
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                    />
                    <Button size="sm" className="w-full h-9 text-xs" onClick={() => sendFeedback.mutate()} disabled={sendFeedback.isPending}>
                      {sendFeedback.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
                      Submit Feedback
                    </Button>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="text-center py-3">
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Thank you for your feedback! 🙏</p>
              </div>
            )}

            {/* Share */}
            <Button variant="outline" size="sm" className="w-full h-9 text-xs" onClick={handleShare}>
              <Share2 className="h-3.5 w-3.5 mr-1.5" /> Share Receipt
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
