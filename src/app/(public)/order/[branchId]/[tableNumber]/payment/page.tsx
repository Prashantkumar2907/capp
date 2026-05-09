"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CreditCard, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { CartPanel } from "@/components/features/cart/cart-panel";
import { AppToaster } from "@/components/shared/app-toaster";
import { readApiResponse } from "@/lib/api/client";
import { calculateTotals } from "@/lib/utils";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { useCartStore } from "@/stores/cart-store";
import type { RestaurantTable } from "@/types/database";

interface PublicMenuMeta {
  branch: {
    id: string;
    name: string;
    organizations: { name: string; default_tax_percent: number; tax_inclusive: boolean } | null;
  };
  table: Pick<RestaurantTable, "id" | "branch_id" | "table_number" | "label" | "capacity" | "status"> | null;
}

export default function PublicPaymentPage() {
  const params = useParams<{ branchId: string; tableNumber: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const branchId = safeParam(params.branchId);
  const tableNumber = Number(safeParam(params.tableNumber));
  const cart = useCartStore();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const hasMounted = useHasMounted();
  const cartReady = hasMounted && cart.hasHydrated;
  const cartItems = cartReady ? cart.items : [];

  const menuQueryKey = ["public-menu", branchId, tableNumber] as const;

  const meta = useQuery({
    queryKey: ["public-menu-meta", branchId, tableNumber],
    queryFn: async () => {
      const response = await fetch(`/api/public/menu/meta?branchId=${branchId}&tableNumber=${tableNumber}`);
      return readApiResponse<PublicMenuMeta>(response);
    },
    enabled: !!branchId && !!tableNumber,
    initialData: () => {
      const cachedMenu = queryClient.getQueryData<PublicMenuMeta>(menuQueryKey);
      return cachedMenu ? { branch: cachedMenu.branch, table: cachedMenu.table } : undefined;
    },
    initialDataUpdatedAt: () => queryClient.getQueryState(menuQueryKey)?.dataUpdatedAt,
    retry: false,
  });

  const subtotal = cartItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const totals = useMemo(
    () => calculateTotals(subtotal, Number(meta.data?.branch.organizations?.default_tax_percent ?? 5), Boolean(meta.data?.branch.organizations?.tax_inclusive ?? true)),
    [meta.data?.branch.organizations?.default_tax_percent, meta.data?.branch.organizations?.tax_inclusive, subtotal]
  );

  const submitOrder = async () => {
    if (!cartReady || !cart.items.length || submittingRef.current || meta.isLoading || meta.error) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const clientRequestId = cart.ensureSubmissionKey();
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId,
          tableNumber,
          clientRequestId,
          customerName,
          customerPhone,
          orderSource: "qr_customer",
          orderType: "dine_in",
          notes,
          items: cart.items.map((item) => ({
            dish_id: item.dish_id,
            quantity: item.quantity,
            notes: item.notes,
          })),
        }),
      });
      const payload = await readApiResponse<{ order?: { id: string }; duplicate?: boolean }>(response);
      if (!payload.order) throw new Error("Unable to place order");
      cart.clear();
      toast.success(payload.duplicate ? "Order already received. Opening receipt." : "Order sent to the kitchen.");
      router.replace(`/receipt/${payload.order.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to place order");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-3 py-4 pb-24 sm:px-4 sm:py-5 xl:pb-5">
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
                  <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Review and send order</h1>
                  {meta.isLoading ? (
                    <Skeleton className="mt-2 h-3 w-56" />
                  ) : meta.error ? (
                    <p className="mt-1 text-xs text-destructive">Branch details could not be loaded. Check your connection and try again.</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {meta.data?.branch.organizations?.name ?? "Restaurant"} - Table {tableNumber} - payment after staff confirms
                    </p>
                  )}
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Field id="customer-name" label="Name optional">
                  <Input id="customer-name" value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Your name" />
                </Field>
                <Field id="customer-phone" label="Phone optional">
                  <Input id="customer-phone" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} placeholder="For bill updates" />
                </Field>
              </div>
              <Field id="order-note" label="Order note">
                <Textarea id="order-note" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Anything the kitchen should know" />
              </Field>
              {!cartReady ? (
                <div className="space-y-3 rounded-2xl border border-dashed p-4" aria-label="Loading saved cart">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : !cartItems.length ? (
                <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">Your cart is empty. Return to the menu to add dishes.</div>
              ) : null}
            </CardContent>
          </Card>
        </section>
        <CartPanel
          items={cartItems}
          subtotal={subtotal}
          tax={totals.tax}
          total={totals.total}
          submitLabel="Place order"
          submitClassName="hidden xl:inline-flex"
          loading={!cartReady}
          submitting={submitting}
          disabled={meta.isLoading || Boolean(meta.error)}
          onIncrement={(dishId) => {
            const item = cartItems.find((row) => row.dish_id === dishId);
            if (item) cart.updateQuantity(dishId, item.quantity + 1);
          }}
          onDecrement={(dishId) => cart.updateQuantity(dishId, (cartItems.find((item) => item.dish_id === dishId)?.quantity ?? 1) - 1)}
          onRemove={cart.removeItem}
          onNotes={cart.updateNotes}
          onSubmit={submitOrder}
        />
      </div>
      <div className="fixed inset-x-0 bottom-0 border-t bg-card p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] xl:hidden">
        <Button className="w-full" disabled={!cartReady || !cartItems.length || submitting || meta.isLoading || Boolean(meta.error)} onClick={submitOrder}>
          <Send className="h-4 w-4" />
          {submitting ? "Sending..." : "Place order"}
        </Button>
      </div>
      <AppToaster />
    </main>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function safeParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}
