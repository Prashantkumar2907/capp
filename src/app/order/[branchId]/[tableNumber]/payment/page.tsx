"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CreditCard, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CartPanel } from "@/components/features/cart/cart-panel";
import { calculateTotals } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";

interface PublicMenuMeta {
  branch: {
    id: string;
    name: string;
    organizations: { name: string; default_tax_percent: number; tax_inclusive: boolean } | null;
  };
}

export default function PublicPaymentPage() {
  const params = useParams<{ branchId: string; tableNumber: string }>();
  const router = useRouter();
  const branchId = safeParam(params.branchId);
  const tableNumber = Number(safeParam(params.tableNumber));
  const cart = useCartStore();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const meta = useQuery({
    queryKey: ["public-menu-meta", branchId, tableNumber],
    queryFn: async () => {
      const response = await fetch(`/api/public/menu?branchId=${branchId}&tableNumber=${tableNumber}`);
      const payload = (await response.json()) as PublicMenuMeta & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to load branch");
      return payload;
    },
    enabled: !!branchId && !!tableNumber,
  });

  const subtotal = cart.subtotal();
  const totals = useMemo(
    () => calculateTotals(subtotal, Number(meta.data?.branch.organizations?.default_tax_percent ?? 5), Boolean(meta.data?.branch.organizations?.tax_inclusive ?? true)),
    [meta.data?.branch.organizations?.default_tax_percent, meta.data?.branch.organizations?.tax_inclusive, subtotal]
  );

  const submitOrder = async () => {
    if (!cart.items.length) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId,
          tableNumber,
          customerName,
          customerPhone,
          orderSource: "qr_customer",
          orderType: "dine_in",
          notes,
          items: cart.items.map((item) => ({
            dish_id: item.dish_id,
            quantity: item.quantity,
            variant_id: item.variant_id ?? null,
            addon_ids: item.addon_ids ?? [],
            notes: item.notes,
          })),
        }),
      });
      const payload = (await response.json()) as { error?: string; order?: { id: string } };
      if (!response.ok || !payload.order) throw new Error(payload.error ?? "Unable to place order");
      cart.clear();
      router.replace(`/receipt/${payload.order.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to place order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-5">
      <div className="mx-auto grid max-w-5xl gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4">
          <Link href={`/order/${branchId}/${tableNumber}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back to menu
            </Button>
          </Link>
          <Card>
            <CardContent className="space-y-4 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold">Review and send order</h1>
                  <p className="text-xs text-muted-foreground">Payment can be completed after staff confirms the order.</p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Name optional">
                  <Input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Your name" />
                </Field>
                <Field label="Phone optional">
                  <Input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} placeholder="For bill updates" />
                </Field>
              </div>
              <Field label="Order note">
                <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Anything the kitchen should know" />
              </Field>
              {!cart.items.length ? (
                <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">Your cart is empty. Return to the menu to add dishes.</div>
              ) : null}
            </CardContent>
          </Card>
        </section>
        <CartPanel
          items={cart.items}
          subtotal={subtotal}
          tax={totals.tax}
          total={totals.total}
          submitLabel="Place order"
          submitting={submitting}
          onIncrement={(lineId) => {
            const item = cart.items.find((row) => row.line_id === lineId);
            if (item) cart.updateQuantity(lineId, item.quantity + 1);
          }}
          onDecrement={(lineId) => cart.updateQuantity(lineId, (cart.items.find((item) => item.line_id === lineId)?.quantity ?? 1) - 1)}
          onRemove={cart.removeItem}
          onNotes={cart.updateNotes}
          onSubmit={submitOrder}
        />
      </div>
      <div className="fixed inset-x-0 bottom-0 border-t bg-card p-3 xl:hidden">
        <Button className="w-full" disabled={!cart.items.length || submitting} onClick={submitOrder}>
          <Send className="h-4 w-4" />
          {submitting ? "Sending..." : "Place order"}
        </Button>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function safeParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}
