"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import type { DishAddon, DishVariant } from "@/types/database";

interface DishOptionsEditorProps {
  dishId: string;
  variants: DishVariant[];
  addons: DishAddon[];
}

/**
 * Sizes (Half/Full plate) and add-ons editor. Lives inside the dish dialog;
 * every row saves immediately so owners see changes land as they type-and-add.
 */
export function DishOptionsEditor({ dishId, variants, addons }: DishOptionsEditorProps) {
  const [supabase] = useState(() => createClient());
  const queryClient = useQueryClient();
  const [variantName, setVariantName] = useState("");
  const [variantPrice, setVariantPrice] = useState("");
  const [addonName, setAddonName] = useState("");
  const [addonPrice, setAddonPrice] = useState("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["menu"] });

  const addVariant = useMutation({
    mutationFn: async () => {
      const price = Number(variantPrice);
      if (!variantName.trim() || !Number.isFinite(price) || price <= 0) throw new Error("Enter a size name and price");
      const { error } = await supabase
        .from("dish_variants")
        .insert({ dish_id: dishId, name: variantName.trim(), price, sort_order: variants.length });
      if (error) throw error;
    },
    onSuccess: async () => {
      setVariantName("");
      setVariantPrice("");
      await invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const removeVariant = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("dish_variants").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });

  const addAddon = useMutation({
    mutationFn: async () => {
      const price = Number(addonPrice || 0);
      if (!addonName.trim() || !Number.isFinite(price) || price < 0) throw new Error("Enter an add-on name and price");
      const { error } = await supabase
        .from("dish_addons")
        .insert({ dish_id: dishId, name: addonName.trim(), price, sort_order: addons.length });
      if (error) throw error;
    },
    onSuccess: async () => {
      setAddonName("");
      setAddonPrice("");
      await invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const removeAddon = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("dish_addons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Sizes (Half / Full plate)</p>
        {variants.map((variant) => (
          <div key={variant.id} className="flex items-center justify-between gap-2 rounded-xl border px-3 py-2">
            <span className="text-sm">{variant.name}</span>
            <span className="font-numbers ml-auto text-xs text-muted-foreground">{formatCurrency(Number(variant.price))}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive"
              onClick={() => removeVariant.mutate(variant.id)}
              aria-label={`Remove ${variant.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        <div className="flex gap-2">
          <Input placeholder="Half" value={variantName} onChange={(event) => setVariantName(event.target.value)} />
          <Input placeholder="₹" type="number" className="w-24" value={variantPrice} onChange={(event) => setVariantPrice(event.target.value)} />
          <Button variant="secondary" size="icon" className="shrink-0" disabled={addVariant.isPending} onClick={() => addVariant.mutate()} aria-label="Add size">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Add-ons (Extra cheese, butter…)</p>
        {addons.map((addon) => (
          <div key={addon.id} className="flex items-center justify-between gap-2 rounded-xl border px-3 py-2">
            <span className="text-sm">{addon.name}</span>
            <span className="font-numbers ml-auto text-xs text-muted-foreground">+{formatCurrency(Number(addon.price))}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive"
              onClick={() => removeAddon.mutate(addon.id)}
              aria-label={`Remove ${addon.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        <div className="flex gap-2">
          <Input placeholder="Extra cheese" value={addonName} onChange={(event) => setAddonName(event.target.value)} />
          <Input placeholder="₹" type="number" className="w-24" value={addonPrice} onChange={(event) => setAddonPrice(event.target.value)} />
          <Button variant="secondary" size="icon" className="shrink-0" disabled={addAddon.isPending} onClick={() => addAddon.mutate()} aria-label="Add add-on">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
