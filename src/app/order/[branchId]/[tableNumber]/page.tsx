"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/hooks/use-supabase";
import { useCartStore } from "@/stores/cart-store";
import { formatCurrency } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ShoppingCart, Plus, Minus, UtensilsCrossed, Leaf,
} from "lucide-react";
import Link from "next/link";
import {
  getBranchOrganization,
  getDishPrice,
  type BranchWithOrganization,
  type DishWithRelations,
} from "@/lib/domain";

export default function CustomerOrderPage() {
  const params = useParams();
  const branchId = params.branchId as string;
  const tableNumber = Number(params.tableNumber);
  const supabase = useSupabase();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [vegOnly, setVegOnly] = useState(false);

  const { items, addItem, removeItem, updateQuantity, getItemCount, getSubtotal } = useCartStore();
  const cartCount = getItemCount();

  // Fetch branch + org info
  const { data: branchInfo } = useQuery({
    queryKey: ["branch-info", branchId],
    queryFn: async () => {
      const { data } = await supabase
        .from("branches")
        .select("*, organizations(name, logo_url, accent_color)")
        .eq("id", branchId)
        .single();
      return data;
    },
  });

  // Fetch menu
  const { data: categories } = useQuery({
    queryKey: ["public-categories", branchId],
    queryFn: async () => {
      const orgId = branchInfo?.org_id;
      if (!orgId) return [];
      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("org_id", orgId)
        .eq("is_active", true)
        .order("sort_order");
      return data || [];
    },
    enabled: !!branchInfo?.org_id,
  });

  const { data: dishes, isLoading } = useQuery({
    queryKey: ["public-dishes", branchId],
    queryFn: async () => {
      const orgId = branchInfo?.org_id;
      if (!orgId) return [];
      const { data } = await supabase
        .from("dishes")
        .select("*, categories(name), branch_dishes!inner(is_available, custom_price)")
        .eq("org_id", orgId)
        .eq("is_active", true)
        .eq("branch_dishes.branch_id", branchId)
        .eq("branch_dishes.is_available", true)
        .order("sort_order");
      return data || [];
    },
    enabled: !!branchInfo?.org_id,
  });

  const orgName =
    getBranchOrganization(branchInfo as BranchWithOrganization | null)?.name ||
    "Restaurant";

  const filteredDishes = useMemo(() => {
    return ((dishes || []) as DishWithRelations[]).filter((d) => {
      if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (selectedCategory !== "all" && d.category_id !== selectedCategory) return false;
      if (vegOnly && !d.is_veg) return false;
      return true;
    });
  }, [dishes, search, selectedCategory, vegOnly]);

  const getItemQty = (dishId: string) => items.find(i => i.dish_id === dishId)?.quantity || 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-base font-bold">{orgName}</h1>
              <p className="text-[10px] text-muted-foreground">Table {tableNumber} · {branchInfo?.name}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              className="h-9 pl-9 text-xs rounded-xl bg-muted/50"
              placeholder="Search dishes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Category + veg toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setVegOnly(!vegOnly)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-medium flex items-center gap-1 transition-colors shrink-0 ${
                vegOnly ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground"
              }`}
            >
              <Leaf className="h-3 w-3" /> Veg Only
            </button>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1.5 rounded-full text-[10px] font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                All
              </button>
              {categories?.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 px-4 py-4 max-w-lg mx-auto w-full">
        {isLoading ? (
          <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        ) : filteredDishes.length === 0 ? (
          <div className="text-center py-20">
            <UtensilsCrossed className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No dishes found</p>
            {search && <Button variant="link" size="sm" onClick={() => setSearch("")} className="text-primary text-xs mt-1">Clear search</Button>}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDishes.map((dish, i) => {
              const qty = getItemQty(dish.id);
              const price = getDishPrice(dish);
              return (
                <motion.div
                  key={dish.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card className="overflow-hidden card-hover">
                    <CardContent className="p-0 flex">
                      {/* Image or placeholder */}
                      <div className="w-24 h-24 bg-muted flex items-center justify-center shrink-0 relative overflow-hidden">
                        {dish.image_url ? (
                          <Image
                            src={dish.image_url}
                            alt={dish.name}
                            fill
                            className="object-cover"
                            sizes="96px"
                            unoptimized
                          />
                        ) : (
                          <UtensilsCrossed className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {dish.is_veg ? (
                              <span className="h-3.5 w-3.5 rounded-sm border border-green-500 flex items-center justify-center shrink-0"><span className="h-1.5 w-1.5 rounded-full bg-green-500" /></span>
                            ) : (
                              <span className="h-3.5 w-3.5 rounded-sm border border-red-500 flex items-center justify-center shrink-0"><span className="h-1.5 w-1.5 rounded-full bg-red-500" /></span>
                            )}
                            <span className="text-sm font-medium truncate">{dish.name}</span>
                          </div>
                          {dish.description && (
                            <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">{dish.description}</p>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-bold text-primary">{formatCurrency(price)}</span>
                          {qty > 0 ? (
                            <div className="flex items-center gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0 rounded-lg"
                                onClick={() => qty <= 1 ? removeItem(dish.id) : updateQuantity(dish.id, qty - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <motion.span
                                key={qty}
                                initial={{ scale: 1.3 }}
                                animate={{ scale: 1 }}
                                className="w-5 text-center text-xs font-bold"
                              >
                                {qty}
                              </motion.span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0 rounded-lg"
                                onClick={() => updateQuantity(dish.id, qty + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              className="h-7 text-[10px] px-3 rounded-lg"
                              onClick={() => addItem({
                                dish_id: dish.id, dish_name: dish.name,
                                unit_price: price, is_veg: dish.is_veg,
                                dish_image_url: dish.image_url,
                              })}
                            >
                              <Plus className="h-3 w-3 mr-0.5" /> Add
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart footer */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="sticky bottom-0 z-20"
          >
            <div className="max-w-lg mx-auto px-4 pb-4">
              <Link href={`/order/${branchId}/${tableNumber}/payment`}>
                <Button className="w-full h-12 rounded-xl text-sm font-medium shadow-lg shadow-primary/25 flex items-center justify-between px-5">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-md bg-white/20 flex items-center justify-center">
                      <ShoppingCart className="h-3.5 w-3.5" />
                    </div>
                    <span>{cartCount} item{cartCount > 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>{formatCurrency(getSubtotal())}</span>
                    <span className="text-xs opacity-75">→</span>
                  </div>
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
