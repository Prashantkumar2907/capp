"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRealtimeOrders } from "@/hooks/use-realtime-orders";
import { useQuery, useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, generateOrderNumber, timeAgo } from "@/lib/helpers";
import { SectionHeader } from "@/components/common/section-header";
import { EmptyState } from "@/components/common/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ClipboardList, Plus, Minus, Check, ShoppingBag, Search, Loader2, Clock } from "lucide-react";

export default function WaiterPage() {
  const { branch, staff } = useAuth();
  const { orders, refetch } = useRealtimeOrders(branch?.id);
  const [supabase] = useState(() => createClient());
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [orderDialog, setOrderDialog] = useState(false);
  const [cart, setCart] = useState<Record<string, { name: string; qty: number; price: number }>>({});
  const [search, setSearch] = useState("");
  const [placing, setPlacing] = useState(false);

  const { data: tables } = useQuery({
    queryKey: ["tables-waiter", branch?.id],
    queryFn: async () => {
      const { data } = await supabase.from("tables").select("*").eq("branch_id", branch!.id).order("table_number");
      return data || [];
    },
    enabled: !!branch,
  });

  const { data: dishes } = useQuery({
    queryKey: ["dishes-waiter", branch?.id],
    queryFn: async () => {
      const { data } = await supabase.from("dishes").select("*, categories(name)").eq("org_id", staff!.org_id).eq("is_active", true).order("name");
      return data || [];
    },
    enabled: !!staff,
  });

  const markServed = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase.from("orders").update({ status: "served" }).eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => { refetch(); toast.success("Marked as served"); },
  });

  const addToCart = (dish: any) => {
    setCart(prev => ({
      ...prev,
      [dish.id]: prev[dish.id] ? { ...prev[dish.id], qty: prev[dish.id].qty + 1 } : { name: dish.name, qty: 1, price: dish.price },
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const copy = { ...prev };
      if (copy[id]?.qty > 1) copy[id] = { ...copy[id], qty: copy[id].qty - 1 };
      else delete copy[id];
      return copy;
    });
  };

  const cartTotal = Object.values(cart).reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = Object.values(cart).reduce((s, i) => s + i.qty, 0);

  const placeOrder = async () => {
    if (!selectedTable || cartCount === 0) return;
    setPlacing(true);
    try {
      const orderNumber = generateOrderNumber();
      const { data: order, error } = await supabase.from("orders").insert({
        order_number: orderNumber, branch_id: branch!.id,
        table_number: selectedTable, waiter_id: staff!.id,
        order_type: "dine_in", status: "pending",
        subtotal: cartTotal, tax: 0, total: cartTotal,
      }).select().single();
      if (error) throw error;

      const items = Object.entries(cart).map(([id, item]) => ({
        order_id: order.id, branch_id: branch!.id, dish_id: id,
        dish_name: item.name, quantity: item.qty, price_at_order: item.price,
      }));
      await supabase.from("order_items").insert(items);

      toast.success(`Order #${orderNumber} placed for Table ${selectedTable}`);
      setCart({}); setOrderDialog(false); setSelectedTable(null); refetch();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPlacing(false);
    }
  };

  const activeOrders = orders?.filter(o => ["pending", "confirmed", "preparing", "ready"].includes(o.status)) || [];
  const filteredDishes = dishes?.filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase())) || [];

  return (
    <div className="space-y-5">
      <SectionHeader title="Waiter View" description="Take orders and manage tables" badge="WAITER" />

      {/* Table selection grid */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Select Table to Order</h3>
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
          {tables?.map(table => {
            const hasOrders = activeOrders.some(o => o.table_number === table.table_number);
            return (
              <Button
                key={table.id}
                variant={selectedTable === table.table_number ? "default" : hasOrders ? "secondary" : "outline"}
                size="sm"
                className={`h-12 text-sm font-bold relative ${hasOrders && selectedTable !== table.table_number ? "border-amber-300" : ""}`}
                onClick={() => { setSelectedTable(table.table_number); setOrderDialog(true); }}
              >
                {table.table_number}
                {hasOrders && <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Active orders */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Active Orders ({activeOrders.length})</h3>
        {activeOrders.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No active orders" description="Select a table above to create an order" className="py-8" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeOrders.slice(0, 10).map((order, i) => (
              <motion.div key={order.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="card-hover">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-primary">#{order.order_number}</span>
                        {order.table_number && <Badge variant="outline" className="text-[9px] h-4">Table {order.table_number}</Badge>}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Clock className="h-2.5 w-2.5" /> {timeAgo(order.created_at)}
                      </div>
                    </div>
                    <div className="space-y-1 mb-2">
                      {order.order_items?.slice(0, 3).map((item: any) => (
                        <p key={item.id} className="text-xs text-muted-foreground"><span className="font-medium text-foreground">{item.quantity}×</span> {item.dish_name}</p>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] capitalize">{order.status}</Badge>
                      {order.status === "ready" && (
                        <Button size="sm" className="h-7 text-[10px]" onClick={() => markServed.mutate(order.id)}>
                          <Check className="h-3 w-3 mr-1" /> Mark Served
                        </Button>
                      )}
                      <span className="text-xs font-bold">{formatCurrency(Number(order.total))}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* New Order Dialog */}
      <Dialog open={orderDialog} onOpenChange={(open) => { setOrderDialog(open); if (!open) setCart({}); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-sm">New Order — Table {selectedTable}</DialogTitle>
          </DialogHeader>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input className="h-9 pl-9 text-xs" placeholder="Search dishes..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {filteredDishes.map(dish => {
              const qty = cart[dish.id]?.qty || 0;
              return (
                <div key={dish.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {dish.is_veg ? <span className="h-3 w-3 rounded-sm border border-green-500 flex items-center justify-center"><span className="h-1.5 w-1.5 rounded-full bg-green-500" /></span>
                        : <span className="h-3 w-3 rounded-sm border border-red-500 flex items-center justify-center"><span className="h-1.5 w-1.5 rounded-full bg-red-500" /></span>}
                      <span className="text-xs font-medium truncate">{dish.name}</span>
                    </div>
                    <span className="text-[10px] text-primary font-medium">{formatCurrency(dish.price)}</span>
                  </div>
                  {qty > 0 ? (
                    <div className="flex items-center gap-1.5">
                      <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => removeFromCart(dish.id)}><Minus className="h-3 w-3" /></Button>
                      <span className="w-5 text-center text-xs font-bold">{qty}</span>
                      <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => addToCart(dish)}><Plus className="h-3 w-3" /></Button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => addToCart(dish)}>Add</Button>
                  )}
                </div>
              );
            })}
          </div>
          {cartCount > 0 && (
            <div className="border-t border-border pt-3 mt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{cartCount} items</span>
                <span className="font-bold text-primary">{formatCurrency(cartTotal)}</span>
              </div>
              <Button className="w-full h-10 text-sm" onClick={placeOrder} disabled={placing}>
                {placing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShoppingBag className="h-4 w-4 mr-2" />}
                Place Order
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
