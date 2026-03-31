"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/stores/cart-store";
import { formatCurrency } from "@/lib/helpers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Minus, ShoppingCart, Search, UtensilsCrossed, Loader2 } from "lucide-react";
import Link from "next/link";

type Dish = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_veg: boolean;
  image_url: string | null;
  category_name: string;
  custom_price: number | null;
};

export default function CustomerOrderPage() {
  const params = useParams();
  const branchId = params.branchId as string;
  const tableNumber = Number(params.tableNumber);
  const supabase = createClient();

  const { items, addItem, removeItem, updateQuantity, getSubtotal, getItemCount, setOrderMeta } = useCartStore();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [branchName, setBranchName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setOrderMeta({ branchId, tableId: String(tableNumber) });
  }, [branchId, tableNumber, setOrderMeta]);

  useEffect(() => {
    async function load() {
      const [branchRes, dishesRes] = await Promise.all([
        supabase.from("branches").select("name, organizations(name)").eq("id", branchId).single(),
        supabase
          .from("branch_dishes")
          .select("custom_price, dishes(id, name, description, price, is_veg, image_url, categories(name))")
          .eq("branch_id", branchId)
          .eq("is_available", true),
      ]);

      if (branchRes.data) {
        setBranchName(`${(branchRes.data as any).organizations?.name || ""} — ${branchRes.data.name}`);
      }

      const mapped: Dish[] = (dishesRes.data || []).map((d: any) => ({
        id: d.dishes.id,
        name: d.dishes.name,
        description: d.dishes.description,
        price: Number(d.dishes.price),
        is_veg: d.dishes.is_veg,
        image_url: d.dishes.image_url,
        category_name: d.dishes.categories?.name || "Other",
        custom_price: d.custom_price ? Number(d.custom_price) : null,
      }));

      setDishes(mapped);
      const cats = ["All", ...Array.from(new Set(mapped.map(d => d.category_name)))];
      setCategories(cats);
      setLoading(false);
    }
    load();
  }, [branchId, supabase]);

  const filteredDishes = dishes.filter(d => {
    if (selectedCategory !== "All" && d.category_name !== selectedCategory) return false;
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getCartItem = (dishId: string) => items.find(i => i.dish_id === dishId);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 max-w-lg mx-auto">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-8 w-full mb-3" />
        <div className="space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-20" />)}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-sm font-bold font-poppins">{branchName || "Restaurant"}</h1>
              <p className="text-[10px] text-zinc-500">Table {tableNumber} · Dine-in</p>
            </div>
            <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300 text-[10px]">
              <UtensilsCrossed className="h-2.5 w-2.5 mr-1" /> Menu
            </Badge>
          </div>

          {/* Search */}
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <Input
              className="h-8 text-xs pl-8"
              placeholder="Search dishes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Category pills */}
          <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-medium transition-all ${
                  selectedCategory === c
                    ? "bg-teal-500 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dish List */}
      <div className="flex-1 px-4 py-3 max-w-lg mx-auto w-full">
        <div className="space-y-2">
          {filteredDishes.map(dish => {
            const cartItem = getCartItem(dish.id);
            const price = dish.custom_price ?? dish.price;
            return (
              <Card key={dish.id} className="border-zinc-200 dark:border-zinc-800">
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex-1 mr-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2.5 w-2.5 rounded-sm border ${dish.is_veg ? "border-green-500" : "border-red-500"}`}>
                        <span className={`block h-1.5 w-1.5 rounded-full m-[1px] ${dish.is_veg ? "bg-green-500" : "bg-red-500"}`} />
                      </span>
                      <span className="text-xs font-medium">{dish.name}</span>
                    </div>
                    {dish.description && <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">{dish.description}</p>}
                    <p className="text-xs font-bold text-teal-600 mt-0.5">{formatCurrency(price)}</p>
                  </div>
                  {cartItem ? (
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => {
                        if (cartItem.quantity <= 1) removeItem(dish.id);
                        else updateQuantity(dish.id, cartItem.quantity - 1);
                      }}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-xs w-5 text-center font-medium">{cartItem.quantity}</span>
                      <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => updateQuantity(dish.id, cartItem.quantity + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px] border-teal-500 text-teal-600 hover:bg-teal-50"
                      onClick={() => addItem({ dish_id: dish.id, dish_name: dish.name, unit_price: price, quantity: 1 })}
                    >
                      <Plus className="h-3 w-3 mr-0.5" /> Add
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Cart Footer */}
      {getItemCount() > 0 && (
        <div className="sticky bottom-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 px-4 py-3">
          <div className="max-w-lg mx-auto">
            <Link href={`/order/${branchId}/${tableNumber}/payment`}>
              <Button className="w-full bg-teal-500 hover:bg-teal-600 text-white h-10 text-xs font-medium">
                <ShoppingCart className="h-3.5 w-3.5 mr-2" />
                View Cart · {getItemCount()} items · {formatCurrency(getSubtotal())}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
