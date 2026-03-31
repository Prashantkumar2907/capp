"use client";

import { useState } from "react";
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
import { ArrowLeft, Loader2, QrCode, Minus, Plus, Trash2, StickyNote } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const branchId = params.branchId as string;
  const tableNumber = Number(params.tableNumber);
  const supabase = createClient();

  const { items, removeItem, updateQuantity, updateItemNotes, getSubtotal, clearCart } = useCartStore();
  const [step, setStep] = useState<"cart" | "upi">("cart");
  const [orderNotes, setOrderNotes] = useState("");
  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [upiLink, setUpiLink] = useState("");

  const subtotal = getSubtotal();
  const tax = Math.round(subtotal * 0.05 * 100) / 100; // 5% default
  const total = subtotal + tax;

  const placeOrder = async () => {
    if (items.length === 0) return;
    setPlacing(true);
    try {
      // Fetch branch UPI VPA
      const { data: branch } = await supabase.from("branches").select("upi_vpa, organizations(name, default_tax_percent, tax_inclusive)").eq("id", branchId).single();

      const taxPercent = (branch as any)?.organizations?.default_tax_percent || 5;
      const taxInclusive = (branch as any)?.organizations?.tax_inclusive ?? true;
      const computedTax = taxInclusive ? 0 : Math.round(subtotal * (taxPercent / 100) * 100) / 100;
      const computedTotal = subtotal + computedTax;

      const orderNumber = generateOrderNumber();
      const { data: order, error } = await supabase.from("orders").insert({
        order_number: orderNumber,
        branch_id: branchId,
        table_number: tableNumber,
        order_type: "dine_in",
        status: "pending",
        subtotal,
        tax: computedTax,
        total: computedTotal,
        notes: orderNotes || null,
      }).select().single();

      if (error) throw error;

      const orderItems = items.map(i => ({
        order_id: order.id,
        branch_id: branchId,
        dish_id: i.dish_id,
        dish_name: i.dish_name,
        quantity: i.quantity,
        price_at_order: i.unit_price,
        notes: i.notes || null,
        status: "pending",
      }));

      const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
      if (itemsErr) throw itemsErr;

      // Create pending payment
      const { error: payErr } = await supabase.from("payments").insert({
        order_id: order.id,
        branch_id: branchId,
        amount: computedTotal,
        method: "upi",
        status: "pending",
      });

      setOrderId(order.id);

      // Generate UPI QR if VPA exists
      if (branch?.upi_vpa) {
        const link = generateUPILink(
          branch.upi_vpa,
          computedTotal,
          orderNumber,
          (branch as any)?.organizations?.name || "Restaurant"
        );
        setUpiLink(link);
      }

      setStep("upi");
      clearCart();
      toast.success("Order placed successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  if (step === "upi" && orderId) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <Card className="max-w-sm w-full border-zinc-200 dark:border-zinc-800">
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center mx-auto mb-3">
              <QrCode className="h-6 w-6 text-teal-500" />
            </div>
            <h2 className="text-lg font-bold font-poppins">Pay {formatCurrency(total)}</h2>
            <p className="text-xs text-zinc-500 mt-1">Scan the QR code with any UPI app</p>

            {upiLink ? (
              <div className="my-4 flex justify-center">
                <QRCodeSVG value={upiLink} size={200} fgColor="#14b8a6" includeMargin />
              </div>
            ) : (
              <div className="my-4 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                <p className="text-xs text-zinc-500">UPI payment not configured. Please pay at counter.</p>
              </div>
            )}

            <p className="text-[10px] text-zinc-400 mb-4">
              After payment, your order will be confirmed automatically
            </p>

            <div className="space-y-2">
              <Link href={`/receipt/${orderId}`}>
                <Button className="w-full bg-teal-500 hover:bg-teal-600 text-white h-9 text-xs">
                  View Receipt
                </Button>
              </Link>
              <Link href={`/order/${branchId}/${tableNumber}`}>
                <Button variant="outline" className="w-full h-8 text-xs">
                  Order More
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href={`/order/${branchId}/${tableNumber}`}>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-sm font-bold font-poppins">Your Cart</h1>
            <p className="text-[10px] text-zinc-500">Table {tableNumber} · {items.length} items</p>
          </div>
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 px-4 py-3 max-w-lg mx-auto w-full">
        {items.length === 0 ? (
          <div className="text-center py-20 text-zinc-400">
            <p className="text-sm">Cart is empty</p>
            <Link href={`/order/${branchId}/${tableNumber}`}>
              <Button variant="link" className="text-teal-500 text-xs mt-2">Browse Menu</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(item => (
              <Card key={item.dish_id} className="border-zinc-200 dark:border-zinc-800">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-medium">{item.dish_name}</p>
                      <p className="text-[10px] text-teal-600 font-medium">{formatCurrency(item.unit_price)} each</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" className="h-6 w-6 p-0" onClick={() => {
                        if (item.quantity <= 1) removeItem(item.dish_id);
                        else updateQuantity(item.dish_id, item.quantity - 1);
                      }}>
                        <Minus className="h-2.5 w-2.5" />
                      </Button>
                      <span className="text-xs w-5 text-center">{item.quantity}</span>
                      <Button variant="outline" size="sm" className="h-6 w-6 p-0" onClick={() => updateQuantity(item.dish_id, item.quantity + 1)}>
                        <Plus className="h-2.5 w-2.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 ml-1" onClick={() => removeItem(item.dish_id)}>
                        <Trash2 className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <Input
                      className="h-6 text-[10px] flex-1 mr-2"
                      placeholder="Add note (e.g. less spicy)"
                      value={item.notes || ""}
                      onChange={e => updateItemNotes(item.dish_id, e.target.value)}
                    />
                    <span className="text-xs font-semibold">{formatCurrency(item.unit_price * item.quantity)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Order Notes */}
            <div className="pt-2">
              <Label className="text-xs flex items-center gap-1 mb-1.5">
                <StickyNote className="h-3 w-3" /> Order Notes
              </Label>
              <Textarea
                className="text-xs min-h-[60px]"
                placeholder="Any special instructions..."
                value={orderNotes}
                onChange={e => setOrderNotes(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Payment Footer */}
      {items.length > 0 && (
        <div className="sticky bottom-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 px-4 py-3">
          <div className="max-w-lg mx-auto">
            <div className="space-y-1 mb-3">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Tax (5%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm font-bold">
                <span>Total</span>
                <span className="text-teal-600">{formatCurrency(total)}</span>
              </div>
            </div>
            <Button
              className="w-full bg-teal-500 hover:bg-teal-600 text-white h-10 text-xs font-medium"
              onClick={placeOrder}
              disabled={placing}
            >
              {placing ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <QrCode className="h-3.5 w-3.5 mr-2" />}
              Place Order & Pay via UPI
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
