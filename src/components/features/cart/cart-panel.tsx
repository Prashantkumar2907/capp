"use client";

import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatCurrency } from "@/lib/utils";
import type { CartItem } from "@/stores/cart-store";

interface CartPanelProps {
  items: CartItem[];
  subtotal: number;
  total?: number;
  tax?: number;
  submitLabel: string;
  loading?: boolean;
  submitting?: boolean;
  disabled?: boolean;
  submitClassName?: string;
  onIncrement: (dishId: string) => void;
  onDecrement: (dishId: string) => void;
  onRemove: (dishId: string) => void;
  onNotes?: (dishId: string, notes: string) => void;
  onSubmit: () => void;
}

export function CartPanel({
  items,
  subtotal,
  total,
  tax,
  submitLabel,
  loading,
  submitting,
  disabled,
  submitClassName,
  onIncrement,
  onDecrement,
  onRemove,
  onNotes,
  onSubmit,
}: CartPanelProps) {
  return (
    <Card className="sticky top-4">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Current order</h2>
            <p className="text-xs text-muted-foreground">{items.length ? `${items.length} selected items` : "Add dishes to begin"}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShoppingBag className="h-5 w-5" />
          </div>
        </div>
        {loading ? (
          <div className="space-y-3" aria-label="Loading cart">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="space-y-3 rounded-2xl border bg-card p-3">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-24" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-9 w-28 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length ? (
          <div className="max-h-[46vh] space-y-3 overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item.dish_id} className="space-y-2 rounded-2xl border bg-card p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.dish_name}</p>
                    <p className="font-numbers mt-1 text-xs text-muted-foreground">{formatCurrency(item.unit_price)} each</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    aria-label={`Remove ${item.dish_name}`}
                    onClick={() => onRemove(item.dish_id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 rounded-full border bg-secondary p-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Decrease ${item.dish_name}`} onClick={() => onDecrement(item.dish_id)}>
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="font-numbers w-6 text-center text-xs font-semibold">{item.quantity}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Increase ${item.dish_name}`} onClick={() => onIncrement(item.dish_id)}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="font-numbers text-sm font-semibold">{formatCurrency(item.unit_price * item.quantity)}</p>
                </div>
                {onNotes ? (
                  <Textarea
                    rows={2}
                    value={item.notes ?? ""}
                    maxLength={240}
                    placeholder="Item note"
                    aria-label={`Note for ${item.dish_name}`}
                    onChange={(event) => onNotes(item.dish_id, event.target.value)}
                  />
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed p-8 text-center text-xs text-muted-foreground">Your cart is empty.</div>
        )}
        <div className="space-y-2 rounded-2xl bg-secondary p-3 text-sm">
          {loading ? (
            <>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-5 w-full" />
            </>
          ) : (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-numbers">{formatCurrency(subtotal)}</span>
            </div>
          )}
          {!loading && typeof tax === "number" ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Taxes</span>
              <span className="font-numbers">{formatCurrency(tax)}</span>
            </div>
          ) : null}
          {!loading ? (
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Total</span>
              <span className="font-numbers">{formatCurrency(total ?? subtotal)}</span>
            </div>
          ) : null}
        </div>
        <Button className={cn("w-full", submitClassName)} disabled={loading || disabled || !items.length || submitting} onClick={onSubmit}>
          {loading ? "Loading order..." : submitting ? "Working..." : submitLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
