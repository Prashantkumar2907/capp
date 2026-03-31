"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRealtimeOrders } from "@/hooks/use-realtime-orders";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, timeAgo, generateOrderNumber } from "@/lib/helpers";
import { ORDER_STATUS_LABELS, TABLE_STATUS_COLORS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ClipboardList, Plus, Minus, ShoppingCart, UtensilsCrossed, Loader2 } from "lucide-react";

type CartItem = { dish_id: string; dish_name: string; price: number; quantity: number };

export default function WaiterPage() {
  const { branch, staff } = useAuth();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { orders } = useRealtimeOrders(branch?.id);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);

  const { data: tables } = useQuery({
    queryKey: ["tables", branch?.id],
    queryFn: async () => {
      const { data } = await supabase.from("tables").select("*").eq("branch_id", branch!.id).eq("is_active", true).order("table_number");
      return data || [];
    },
    enabled: !!branch,
  });

  const { data: dishes } = useQuery({
    queryKey: ["dishes", branch?.id],
    queryFn: async () => {
      const { data } = await supabase.from("branch_dishes").select("*, dishes(id, name, price, is_veg, category_id, categories(name))").eq("branch_id", branch!.id).eq("is_available", true);
      return data || [];
    },
    enabled: !!branch,
  });

  const myOrders = orders?.filter(o => o.waiter_id === staff?.id && ["pending", "confirmed", "preparing", "ready"].includes(o.status)) || [];

  const addToCart = (dish: any) => {
    setCart(prev => {
      const existing = prev.find(c => c.dish_id === dish.dishes.id);
      if (existing) return prev.map(c => c.dish_id === dish.dishes.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { dish_id: dish.dishes.id, dish_name: dish.dishes.name, price: Number(dish.custom_price || dish.dishes.price), quantity: 1 }];
    });
  };

  const updateCartQty = (dishId: string, delta: number) => {
    setCart(prev => prev.map(c => c.dish_id === dishId ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c).filter(c => c.quantity > 0));
  };

  const cartTotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);

  const placeOrder = useMutation({
    mutationFn: async () => {
      if (!selectedTable || cart.length === 0) throw new Error("Select a table and add items");
      const orderNumber = generateOrderNumber();
      const { data: order, error } = await supabase.from("orders").insert({
        order_number: orderNumber,
        branch_id: branch!.id,
        table_number: selectedTable,
        waiter_id: staff?.id,
        order_type: "dine_in",
        status: "pending",
        subtotal: cartTotal,
        tax: 0,
        total: cartTotal,
      }).select().single();
      if (error) throw error;

      const items = cart.map(c => ({
        order_id: order.id,
        branch_id: branch!.id,
        dish_id: c.dish_id,
        dish_name: c.dish_name,
        quantity: c.quantity,
        price_at_order: c.price,
        status: "pending",
      }));
      const { error: itemsError } = await supabase.from("order_items").insert(items);
      if (itemsError) throw itemsError;

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setCart([]);
      setOrderDialogOpen(false);
      toast.success("Order placed!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const markServed = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase.from("orders").update({ status: "served" }).eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-poppins">Waiter</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{myOrders.length} active orders</p>
        </div>
        <Button size="sm" className="bg-teal-500 hover:bg-teal-600 text-white h-8 text-xs" onClick={() => setOrderDialogOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> New Order
        </Button>
      </div>

      {/* Tables Grid */}
      <div>
        <h2 className="text-xs font-semibold mb-2">Tables</h2>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {tables?.map(t => {
            const hasOrder = orders?.some(o => o.table_number === t.table_number && ["pending", "confirmed", "preparing", "ready"].includes(o.status));
            return (
              <button
                key={t.id}
                onClick={() => { setSelectedTable(t.table_number); setOrderDialogOpen(true); }}
                className={`h-12 rounded-lg border-2 text-xs font-medium transition-all ${
                  hasOrder ? "border-orange-400 bg-orange-50 dark:bg-orange-950/30 text-orange-600" :
                  t.status === "available" ? "border-teal-400 bg-teal-50 dark:bg-teal-950/30 text-teal-600 hover:bg-teal-100" :
                  "border-zinc-300 dark:border-zinc-700 text-zinc-400"
                }`}
              >
                T{t.table_number}
              </button>
            );
          })}
        </div>
      </div>

      {/* My Active Orders */}
      <div>
        <h2 className="text-xs font-semibold mb-2">My Orders</h2>
        {myOrders.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-6">No active orders</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {myOrders.map(o => (
              <Card key={o.id} className="border-zinc-200 dark:border-zinc-800">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-teal-600">#{o.order_number}</span>
                      <Badge className="text-[9px] h-4">Table {o.table_number}</Badge>
                      <Badge variant="outline" className="text-[9px] h-4">{ORDER_STATUS_LABELS[o.status as keyof typeof ORDER_STATUS_LABELS]}</Badge>
                    </div>
                    <span className="text-[10px] text-zinc-500">{timeAgo(o.created_at)}</span>
                  </div>
                  <div className="space-y-0.5">
                    {o.order_items?.slice(0, 3).map((item: any) => (
                      <p key={item.id} className="text-[10px] text-zinc-500">{item.quantity}× {item.dish_name}</p>
                    ))}
                    {(o.order_items?.length || 0) > 3 && <p className="text-[10px] text-zinc-400">+{(o.order_items?.length || 0) - 3} more</p>}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs font-semibold">{formatCurrency(Number(o.total))}</span>
                    {o.status === "ready" && (
                      <Button size="sm" className="h-6 text-[10px] bg-teal-500 hover:bg-teal-600 text-white" onClick={() => markServed.mutate(o.id)}>
                        Mark Served
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* New Order Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-poppins flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4" />
              New Order — Table {selectedTable || "?"}
            </DialogTitle>
          </DialogHeader>

          {/* Table selector */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tables?.filter(t => t.status === "available").map(t => (
              <button
                key={t.id}
                className={`h-7 w-10 rounded text-[10px] font-medium border ${selectedTable === t.table_number ? "border-teal-500 bg-teal-500 text-white" : "border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:border-teal-400"}`}
                onClick={() => setSelectedTable(t.table_number)}
              >
                T{t.table_number}
              </button>
            ))}
          </div>

          {/* Menu Items */}
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {dishes?.map(d => {
              const item = cart.find(c => c.dish_id === d.dishes?.id);
              return (
                <div key={d.id} className="flex items-center justify-between p-2 rounded-md border border-zinc-200 dark:border-zinc-800">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${d.dishes?.is_veg ? "bg-green-500" : "bg-red-500"}`} />
                      <span className="text-xs">{d.dishes?.name}</span>
                    </div>
                    <span className="text-[10px] text-teal-600 font-medium">{formatCurrency(Number(d.custom_price || d.dishes?.price || 0))}</span>
                  </div>
                  {item ? (
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" className="h-6 w-6 p-0" onClick={() => updateCartQty(d.dishes!.id, -1)}><Minus className="h-2.5 w-2.5" /></Button>
                      <span className="text-xs w-5 text-center">{item.quantity}</span>
                      <Button variant="outline" size="sm" className="h-6 w-6 p-0" onClick={() => updateCartQty(d.dishes!.id, 1)}><Plus className="h-2.5 w-2.5" /></Button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => addToCart(d)}>Add</Button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Cart Summary */}
          {cart.length > 0 && (
            <div className="border-t pt-3 mt-3">
              <div className="space-y-1">
                {cart.map(c => (
                  <div key={c.dish_id} className="flex justify-between text-xs">
                    <span>{c.quantity}× {c.dish_name}</span>
                    <span>{formatCurrency(c.price * c.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-sm font-bold mt-2 pt-2 border-t">
                <span>Total</span>
                <span className="text-teal-600">{formatCurrency(cartTotal)}</span>
              </div>
              <Button
                className="w-full bg-teal-500 hover:bg-teal-600 text-white h-8 text-xs mt-3"
                onClick={() => placeOrder.mutate()}
                disabled={placeOrder.isPending || !selectedTable}
              >
                {placeOrder.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <ShoppingCart className="h-3 w-3 mr-1" />}
                Place Order ({cart.reduce((s,c) => s + c.quantity, 0)} items)
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
