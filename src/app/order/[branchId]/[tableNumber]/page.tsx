"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Search, ShoppingBag, Table2, UtensilsCrossed } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { DishTile } from "@/components/features/menu/dish-tile";
import { DishOptionsDialog } from "@/components/features/menu/dish-options-dialog";
import { CartPanel } from "@/components/features/cart/cart-panel";
import { calculateTotals } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import type { Category, DishWithRelations, RestaurantTable } from "@/types/database";

interface PublicMenu {
  branch: {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    organizations: { name: string; default_tax_percent: number; tax_inclusive: boolean } | null;
  };
  table: RestaurantTable | null;
  categories: Category[];
  dishes: DishWithRelations[];
}

export default function PublicOrderPage() {
  const params = useParams<{ branchId: string; tableNumber: string }>();
  const router = useRouter();
  const branchId = safeParam(params.branchId);
  const tableNumber = Number(safeParam(params.tableNumber));
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const cart = useCartStore();
  const [optionsDish, setOptionsDish] = useState<DishWithRelations | null>(null);

  useEffect(() => {
    if (branchId && tableNumber) cart.setContext(branchId, tableNumber);
  }, [branchId, cart, tableNumber]);

  const menu = useQuery({
    queryKey: ["public-menu", branchId, tableNumber],
    queryFn: async () => {
      const response = await fetch(`/api/public/menu?branchId=${branchId}&tableNumber=${tableNumber}`);
      const payload = (await response.json()) as PublicMenu & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to load menu");
      return payload;
    },
    enabled: !!branchId && !!tableNumber,
  });

  const dishes = useMemo(() => {
    return (menu.data?.dishes ?? []).filter((dish) => {
      if (search && !dish.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (categoryId !== "all" && dish.category_id !== categoryId) return false;
      return true;
    });
  }, [categoryId, menu.data?.dishes, search]);

  const subtotal = cart.subtotal();
  const totals = calculateTotals(subtotal, Number(menu.data?.branch.organizations?.default_tax_percent ?? 5), Boolean(menu.data?.branch.organizations?.tax_inclusive ?? true));

  const addDish = (dish: DishWithRelations) => {
    const hasOptions = (dish.dish_variants?.length ?? 0) > 0 || (dish.dish_addons?.length ?? 0) > 0;
    if (hasOptions) {
      setOptionsDish(dish);
      return;
    }
    cart.addItem({
      dish_id: dish.id,
      dish_name: dish.name,
      unit_price: Number(dish.price),
      image_url: dish.image_url,
      is_veg: dish.is_veg,
    });
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <UtensilsCrossed className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{menu.data?.branch.organizations?.name ?? "CAPP"}</p>
                <p className="truncate text-xs text-muted-foreground">{menu.data?.branch.name ?? "Loading menu"}</p>
              </div>
            </div>
          </div>
          <Badge variant="secondary">
            <Table2 className="h-3 w-3" />
            Table {tableNumber}
          </Badge>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4">
          <Card>
            <CardContent className="space-y-3 p-4">
              <div>
                <h1 className="text-xl font-semibold">Order at your table</h1>
                <p className="mt-1 text-sm text-muted-foreground">Choose dishes, add item notes, and send the order straight to the kitchen queue.</p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search the menu" value={search} onChange={(event) => setSearch(event.target.value)} />
              </div>
            </CardContent>
          </Card>
          <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
            <button className={`rounded-full px-3 py-2 text-xs font-medium ${categoryId === "all" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`} onClick={() => setCategoryId("all")}>
              All
            </button>
            {menu.data?.categories.map((category) => (
              <button key={category.id} className={`rounded-full px-3 py-2 text-xs font-medium ${categoryId === category.id ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`} onClick={() => setCategoryId(category.id)}>
                {category.name}
              </button>
            ))}
          </div>
          {menu.isLoading ? (
            <div className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-32" />
              ))}
            </div>
          ) : menu.error ? (
            <Card>
              <CardContent className="p-8 text-sm text-destructive">{menu.error.message}</CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {dishes.map((dish) => (
                <DishTile
                  key={dish.id}
                  dish={dish}
                  quantity={cart.dishQuantity(dish.id)}
                  onAdd={() => addDish(dish)}
                  onRemove={() => cart.decrementDish(dish.id)}
                />
              ))}
            </div>
          )}
        </section>
        <aside className="hidden xl:block">
          <CartPanel
            items={cart.items}
            subtotal={subtotal}
            tax={totals.tax}
            total={totals.total}
            submitLabel="Review order"
            onIncrement={(lineId) => {
              const line = cart.items.find((item) => item.line_id === lineId);
              if (line) cart.updateQuantity(lineId, line.quantity + 1);
            }}
            onDecrement={(lineId) => cart.updateQuantity(lineId, (cart.items.find((item) => item.line_id === lineId)?.quantity ?? 1) - 1)}
            onRemove={cart.removeItem}
            onNotes={cart.updateNotes}
            onSubmit={() => router.push(`/order/${branchId}/${tableNumber}/payment`)}
          />
        </aside>
      </div>
      {cart.items.length ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-card p-3 shadow-sm xl:hidden">
          <Link href={`/order/${branchId}/${tableNumber}/payment`}>
            <Button className="w-full">
              <ShoppingBag className="h-4 w-4" />
              Review {cart.count()} items
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      ) : null}
      <DishOptionsDialog
        dish={optionsDish}
        open={!!optionsDish}
        onOpenChange={(open) => !open && setOptionsDish(null)}
        onConfirm={(selection) => {
          if (!optionsDish) return;
          cart.addItem({
            dish_id: optionsDish.id,
            dish_name: optionsDish.name,
            unit_price: selection.unit_price,
            variant_id: selection.variant_id,
            variant_name: selection.variant_name,
            addon_ids: selection.addon_ids,
            addon_names: selection.addon_names,
            addon_total: selection.addon_total,
            image_url: optionsDish.image_url,
            is_veg: optionsDish.is_veg,
          });
        }}
      />
    </main>
  );
}

function safeParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}
