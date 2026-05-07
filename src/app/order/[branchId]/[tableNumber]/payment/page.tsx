"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/stores/cart-store";
import { formatCurrency, generateOrderNumber, generateUPILink } from "@/lib/helpers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, QrCode, Minus, Plus, Trash2, StickyNote, CheckCircle2, ShoppingBag } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const branchId = params.branchId as string;
  const tableNumber = Number(params.tableNumber);
  const [supabase] = useState(() => createClient());

  const { items, removeItem, updateQuantity, updateItemNotes, getSubtotal, clearCart, getItemCount } = useCartStore();
  const [step, setStep] = useState<"cart" | "upi" | "success">("cart");
  const [orderNotes, setOrderNotes] = useState("");
  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [upiLink, setUpiLink] = useState("");
  const [taxPercent, setTaxPercent] = useState<number | null>(null);
  const [taxInclusive, setTaxInclusive] = useState(true);

  useEffect(() => {
    async function fetchTax() {
      const { data: branch } = await supabase
        .from("branches")
        .select("organizations(default_tax_percent, tax_inclusive)")
        .eq("id", branchId)
        .single();
      if (branch) {
        const org = (branch as any).organizations;
        setTaxPercent(org?.default_tax_percent ?? 5);
        setTaxInclusive(org?.tax_inclusive ?? true);
      } else {
        setTaxPercent(5);
      }
    }
    fetchTax();
  }, [branchId, supabase]);

  const subtotal = getSubtotal();
  const effectiveTax = taxPercent ?? 5;
  const tax = taxInclusive ? 0 : Math.round(subtotal * (effectiveTax / 100) * 100) / 100;
  const total = subtotal + tax;

  const placeOrder = async () => {
    if (items.length === 0) return;
    setPlacing(true);
    try {
      const { data: branch } = await supabase
        .from("branches")
        .select("upi_vpa, organizations(name, default_tax_percent, tax_inclusive)")
        .eq("id", branchId)
        .single();

      const tp = (branch as any)?.organizations?.default_tax_percent || 5;
      const ti = (branch as any)?.organizations?.tax_inclusive ?? true;
      const computedTax = ti ? 0 : Math.round(subtotal * (tp / 100) * 100) / 100;
      const computedTotal = subtotal + computedTax;

      const orderNumber = generateOrderNumber();
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber, branch_id: branchId,
          table_number: tableNumber, order_type: "dine_in", status: "pending",
          subtotal, tax: computedTax, total: computedTotal,
          notes: orderNotes || null,
        })
        .select()
        .single();

      if (error) throw error;

      const orderItems = items.map(i => ({
        order_id: order.id, branch_id: branchId, dish_id: i.dish_id,
        dish_name: i.dish_name, quantity: i.quantity,
        price_at_order: i.unit_price, notes: i.notes || null, status: "pending",
      }));

      const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
      if (itemsErr) throw itemsErr;

      await supabase.from("payments").insert({
        order_id: order.id, branch_id: branchId,
        amount: computedTotal, method: "upi", status: "pending",
      });

      setOrderId(order.id);

      if (branch?.upi_vpa) {
        const link = generateUPILink(
          branch.upi_vpa, computedTotal, orderNumber,
          (branch as any)?.organizations?.name || "Restaurant"
        );
        setUpiLink(link);
      }

      clearCart();
      setStep("success");
      toast.success("Order placed successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  // Success / UPI screen
  if (step === "success" && orderId) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", bounce: 0.3 }}>
          <Card className="max-w-sm w-full border-border shadow-xl">
            <CardContent className="p-6 text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
              >
                <div className="mx-auto h-16 w-16 rounded-2xl bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </motion.div>

              <div>
                <h2 className="text-lg font-bold">Order Placed! 🎉</h2>
                <p className="text-xs text-muted-foreground mt-1">Your order is being prepared</p>
              </div>

              {upiLink ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Pay {formatCurrency(total)}</p>
                  <div className="flex justify-center p-4 bg-white rounded-xl">
                    <QRCodeSVG value={upiLink} size={180} fgColor="#14b8a6" includeMargin />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Scan with any UPI app to pay
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-muted rounded-xl">
                  <p className="text-xs text-muted-foreground">
                    UPI not configured. Please pay at the counter.
                  </p>
                </div>
              )}

              <div className="space-y-2 pt-2">
                <Link href={`/receipt/${orderId}`}>
                  <Button className="w-full h-10 text-sm">View Receipt</Button>
                </Link>
                <Link href={`/order/${branchId}/${tableNumber}`}>
                  <Button variant="outline" className="w-full h-9 text-xs">Order More</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href={`/order/${branchId}/${tableNumber}`}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-sm font-bold">Your Cart</h1>
            <p className="text-[10px] text-muted-foreground">
              Table {tableNumber} · {getItemCount()} item{getItemCount() > 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 px-4 py-4 max-w-lg mx-auto w-full">
        {items.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Your cart is empty</p>
            <Link href={`/order/${branchId}/${tableNumber}`}>
              <Button variant="link" className="text-primary text-xs mt-2">Browse Menu</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <motion.div key={item.dish_id} layout>
                <Card className="overflow-hidden">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {item.is_veg ? (
                            <span className="h-3 w-3 rounded-sm border border-green-500 flex items-center justify-center shrink-0"><span className="h-1.5 w-1.5 rounded-full bg-green-500" /></span>
                          ) : (
                            <span className="h-3 w-3 rounded-sm border border-red-500 flex items-center justify-center shrink-0"><span className="h-1.5 w-1.5 rounded-full bg-red-500" /></span>
                          )}
                          <span className="text-sm font-medium truncate">{item.dish_name}</span>
                        </div>
                        <p className="text-[10px] text-primary font-medium mt-0.5">{formatCurrency(item.unit_price)} each</p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button variant="outline" size="sm" className="h-7 w-7 p-0"
                          onClick={() => item.quantity <= 1 ? removeItem(item.dish_id) : updateQuantity(item.dish_id, item.quantity - 1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-5 text-center text-xs font-bold">{item.quantity}</span>
                        <Button variant="outline" size="sm" className="h-7 w-7 p-0"
                          onClick={() => updateQuantity(item.dish_id, item.quantity + 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive ml-1"
                          onClick={() => removeItem(item.dish_id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-2">
                      <Input
                        className="h-7 text-[10px] flex-1 mr-3 rounded-lg"
                        placeholder="Add note (e.g. less spicy)"
                        value={item.notes || ""}
                        onChange={e => updateItemNotes(item.dish_id, e.target.value)}
                      />
                      <span className="text-sm font-bold shrink-0">{formatCurrency(item.unit_price * item.quantity)}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {/* Order notes */}
            <div className="pt-2">
              <Label className="text-xs flex items-center gap-1 mb-1.5">
                <StickyNote className="h-3 w-3" /> Order Notes
              </Label>
              <Textarea
                className="text-xs min-h-[60px] rounded-xl"
                placeholder="Any special instructions..."
                value={orderNotes}
                onChange={e => setOrderNotes(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Payment footer */}
      {items.length > 0 && (
        <div className="sticky bottom-0 bg-card/95 backdrop-blur-md border-t border-border px-4 py-4">
          <div className="max-w-lg mx-auto">
            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Tax ({taxInclusive ? "Inclusive" : `${effectiveTax}%`})</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>
            <Button
              className="w-full h-12 text-sm font-medium rounded-xl shadow-lg shadow-primary/20"
              onClick={placeOrder}
              disabled={placing}
            >
              {placing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <QrCode className="h-4 w-4 mr-2" />}
              Place Order & Pay via UPI
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
