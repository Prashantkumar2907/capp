"use client";

import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import { lineUnitTotal, type CartItem } from "@/stores/cart-store";

interface CartPanelProps {
  items: CartItem[];
  subtotal: number;
  total?: number;
  tax?: number;
  submitLabel: string;
  submitting?: boolean;
  disabled?: boolean;
  onIncrement: (lineId: string) => void;
  onDecrement: (lineId: string) => void;
  onRemove: (lineId: string) => void;
  onNotes?: (lineId: string, notes: string) => void;
  onSubmit: () => void;
}

export function CartPanel({ items, subtotal, total, tax, submitLabel, submitting, disabled, onIncrement, onDecrement, onRemove, onNotes, onSubmit }: CartPanelProps) {
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
        {items.length ? (
          <div className="max-h-[46vh] space-y-3 overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item.line_id} className="space-y-2 rounded-2xl border bg-card p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {item.dish_name}
                      {item.variant_name ? <span className="text-muted-foreground"> · {item.variant_name}</span> : null}
                    </p>
                    {item.addon_names?.length ? (
                      <p className="mt-0.5 truncate text-[0.65rem] text-muted-foreground">+ {item.addon_names.join(", ")}</p>
                    ) : null}
                    <p className="font-numbers mt-1 text-xs text-muted-foreground">{formatCurrency(lineUnitTotal(item))} each</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onRemove(item.line_id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 rounded-full border bg-secondary p-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDecrement(item.line_id)}>
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="font-numbers w-6 text-center text-xs font-semibold">{item.quantity}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onIncrement(item.line_id)}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="font-numbers text-sm font-semibold">{formatCurrency(item.unit_price * item.quantity)}</p>
                </div>
                {onNotes ? <Textarea rows={2} value={item.notes ?? ""} placeholder="Item note" onChange={(event) => onNotes(item.line_id, event.target.value)} /> : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed p-8 text-center text-xs text-muted-foreground">Your cart is empty.</div>
        )}
        <div className="space-y-2 rounded-2xl bg-secondary p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-numbers">{formatCurrency(subtotal)}</span>
          </div>
          {typeof tax === "number" ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Taxes</span>
              <span className="font-numbers">{formatCurrency(tax)}</span>
            </div>
          ) : null}
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>Total</span>
            <span className="font-numbers">{formatCurrency(total ?? subtotal)}</span>
          </div>
        </div>
        <Button className="w-full" disabled={disabled || !items.length || submitting} onClick={onSubmit}>
          {submitting ? "Working..." : submitLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
