"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { DishWithRelations } from "@/types/database";

interface DishOptionsDialogProps {
  dish: DishWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (selection: {
    variant_id: string | null;
    variant_name: string | null;
    unit_price: number;
    addon_ids: string[];
    addon_names: string[];
    addon_total: number;
  }) => void;
}

/**
 * Half/Full plate + add-on picker. Kept deliberately simple: one tap per
 * choice, running total always visible, big confirm button.
 */
export function DishOptionsDialog({ dish, open, onOpenChange, onConfirm }: DishOptionsDialogProps) {
  const variants = useMemo(
    () => (dish?.dish_variants ?? []).filter((variant) => variant.is_available).sort((a, b) => a.sort_order - b.sort_order || a.price - b.price),
    [dish]
  );
  const addons = useMemo(
    () => (dish?.dish_addons ?? []).filter((addon) => addon.is_available).sort((a, b) => a.sort_order - b.sort_order),
    [dish]
  );

  const [variantId, setVariantId] = useState<string | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());

  // reset when a different dish opens
  const [lastDishId, setLastDishId] = useState<string | null>(null);
  if (dish && dish.id !== lastDishId) {
    setLastDishId(dish.id);
    setVariantId(variants[0]?.id ?? null);
    setSelectedAddons(new Set());
  }

  if (!dish) return null;

  const activeVariant = variants.find((variant) => variant.id === variantId) ?? null;
  const unitPrice = activeVariant ? Number(activeVariant.price) : Number(dish.price);
  const addonTotal = addons.filter((addon) => selectedAddons.has(addon.id)).reduce((sum, addon) => sum + Number(addon.price), 0);

  const toggleAddon = (addonId: string) => {
    setSelectedAddons((previous) => {
      const next = new Set(previous);
      if (next.has(addonId)) next.delete(addonId);
      else next.add(addonId);
      return next;
    });
  };

  const confirm = () => {
    const chosen = addons.filter((addon) => selectedAddons.has(addon.id));
    onConfirm({
      variant_id: activeVariant?.id ?? null,
      variant_name: activeVariant?.name ?? null,
      unit_price: unitPrice,
      addon_ids: chosen.map((addon) => addon.id),
      addon_names: chosen.map((addon) => addon.name),
      addon_total: addonTotal,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={dish.name} className="max-w-md">
      <div className="space-y-4">
        {variants.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Choose size</p>
            <div className="grid grid-cols-2 gap-2">
              {variants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setVariantId(variant.id)}
                  className={`rounded-2xl border p-3 text-left transition-colors ${
                    variantId === variant.id ? "border-primary bg-primary/10" : "bg-card hover:border-primary/40"
                  }`}
                >
                  <p className="text-sm font-medium">{variant.name}</p>
                  <p className="font-numbers mt-1 text-xs text-muted-foreground">{formatCurrency(Number(variant.price))}</p>
                </button>
              ))}
            </div>
          </div>
        )}
        {addons.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Add-ons</p>
            <div className="space-y-1.5">
              {addons.map((addon) => (
                <button
                  key={addon.id}
                  type="button"
                  onClick={() => toggleAddon(addon.id)}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-colors ${
                    selectedAddons.has(addon.id) ? "border-primary bg-primary/10" : "bg-card hover:border-primary/40"
                  }`}
                >
                  <span className="text-sm">{addon.name}</span>
                  <span className="font-numbers text-xs text-muted-foreground">+{formatCurrency(Number(addon.price))}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <Button className="w-full" size="lg" onClick={confirm}>
          <Plus className="h-4 w-4" />
          Add — {formatCurrency(unitPrice + addonTotal)}
        </Button>
      </div>
    </Dialog>
  );
}
