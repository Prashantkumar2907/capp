"use client";

import { FssaiMark } from "@/components/features/menu/fssai-mark";
import { Leaf, Minus, Plus, Timer, UtensilsCrossed } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import type { DishWithRelations } from "@/types/database";

interface DishTileProps {
  dish: DishWithRelations;
  quantity?: number;
  disabled?: boolean;
  onAdd?: () => void;
  onRemove?: () => void;
  className?: string;
}

export function DishTile({ dish, quantity = 0, disabled, onAdd, onRemove, className }: DishTileProps) {
  const available = dish.is_active && !disabled;

  return (
    <Card className={cn("group transition-colors duration-150 hover:border-primary/40", !available && "opacity-60", className)}>
      <CardContent className="flex gap-3 p-3">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-secondary">
          {dish.image_url ? (
            <div className="h-full w-full bg-cover bg-center transition-transform duration-300 group-hover:scale-105" role="img" aria-label={dish.name} style={{ backgroundImage: `url(${dish.image_url})` }} />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <UtensilsCrossed className="h-7 w-7 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="truncate text-sm font-semibold">{dish.name}</h3>
                <FssaiMark isVeg={!!dish.is_veg} />
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{dish.description || dish.categories?.name || "Fresh from the kitchen"}</p>
            </div>
            <p className="font-numbers shrink-0 text-sm font-semibold text-primary">{formatCurrency(dish.price)}</p>
          </div>
          <div className="mt-auto flex items-center justify-between pt-3">
            <Badge variant="secondary">
              <Timer className="h-3 w-3" />
              {dish.prep_time_mins}m
            </Badge>
            {quantity > 0 ? (
              <div className="flex items-center gap-2 rounded-full border bg-card p-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRemove} aria-label={`Remove ${dish.name}`}>
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <span className="font-numbers w-5 text-center text-xs font-semibold">{quantity}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onAdd} disabled={!available} aria-label={`Add ${dish.name}`}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="secondary" onClick={onAdd} disabled={!available}>
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
