"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Armchair, ClipboardList, PlusCircle, Search, Send, ShoppingBag, Table2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { OrderStatusBadge } from "@/components/shared/status-badge";
import { DishTile } from "@/components/features/menu/dish-tile";
import { DishOptionsDialog } from "@/components/features/menu/dish-options-dialog";
import { CartPanel } from "@/components/features/cart/cart-panel";
import { createClient } from "@/lib/supabase/client";
import { getBranchMenu } from "@/lib/supabase/queries";
import { calculateTotals, formatCurrency, timeAgo } from "@/lib/utils";
import { useRealtimeOrders } from "@/hooks/use-realtime-orders";
import { useAuth } from "@/features/auth/auth-provider";
import { cartLineId, lineUnitTotal, type CartItem } from "@/stores/cart-store";
import type { DishWithRelations, RestaurantTable } from "@/types/database";

type OrderMode = "dine_in" | "takeaway" | "counter";

export default function WaiterPage() {
  const { organization, branch, staff } = useAuth();
  const [supabase] = useState(() => createClient());
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"new" | "open">("new");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [orderMode, setOrderMode] = useState<OrderMode>("dine_in");
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<CartItem[]>([]);
  const [optionsDish, setOptionsDish] = useState<DishWithRelations | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  const menu = useQuery({
    queryKey: ["menu", organization?.id],
    queryFn: () => getBranchMenu(supabase, organization!.id),
    enabled: !!organization,
  });

  const tables = useQuery({
    queryKey: ["tables", branch?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("tables").select("*").eq("branch_id", branch!.id).neq("status", "inactive").order("table_number");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!branch,
  });

  const { orders, refresh: refreshOrders } = useRealtimeOrders(branch?.id);
  const openOrders = useMemo(() => orders.filter((order) => !["served", "cancelled"].includes(order.status)), [orders]);
  const selectedOrder = openOrders.find((order) => order.id === selectedOrderId) ?? null;

  const visibleDishes = useMemo(() => {
    return (menu.data?.dishes ?? []).filter((dish) => {
      if (!dish.is_active) return false;
      if (search && !dish.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (categoryId !== "all" && dish.category_id !== categoryId) return false;
      return true;
    });
  }, [categoryId, menu.data?.dishes, search]);

  const subtotal = items.reduce((sum, item) => sum + lineUnitTotal(item) * item.quantity, 0);
  const totals = calculateTotals(subtotal, Number(organization?.default_tax_percent ?? 5), Boolean(organization?.tax_inclusive ?? true));

  const createOrder = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: branch!.id,
          tableNumber: orderMode === "dine_in" ? tableNumber : null,
          customerName,
          waiterId: staff?.id,
          orderSource: "waiter",
          orderType: orderMode,
          notes,
          items: items.map((item) => ({
            dish_id: item.dish_id,
            quantity: item.quantity,
            variant_id: item.variant_id ?? null,
            addon_ids: item.addon_ids ?? [],
            notes: item.notes,
          })),
        }),
      });
      const payload = (await response.json()) as { error?: string; order?: { id: string; order_number: string } };
      if (!response.ok) throw new Error(payload.error ?? "Unable to create order");
      return payload.order;
    },
    onSuccess: async (order) => {
      setItems([]);
      setCustomerName("");
      setNotes("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["tables"] }),
        refreshOrders(),
      ]);
      const token = order?.order_number?.split("-").pop();
      toast.success(
        order
          ? orderMode === "counter"
            ? `Order sent — token ${token}`
            : `Order #${order.order_number} sent`
          : "Order sent"
      );
    },
    onError: (error) => toast.error(error.message),
  });

  /** Add a menu selection either to the local cart (new order) or straight onto the selected open order. */
  const commitSelection = async (
    dish: DishWithRelations,
    selection: { variant_id: string | null; variant_name: string | null; unit_price: number; addon_ids: string[]; addon_names: string[]; addon_total: number }
  ) => {
    if (tab === "open") {
      if (!selectedOrder) {
        toast.error("Pick an open order first");
        return;
      }
      try {
        const response = await fetch(`/api/orders/${selectedOrder.id}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: [{ dish_id: dish.id, quantity: 1, variant_id: selection.variant_id, addon_ids: selection.addon_ids }] }),
        });
        const payload = (await response.json()) as { error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Unable to add item");
        await refreshOrders();
        toast.success(`Added to #${selectedOrder.order_number}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Unable to add item");
      }
      return;
    }

    const lineId = cartLineId(dish.id, selection.variant_id, selection.addon_ids);
    setItems((previous) => {
      const existing = previous.find((item) => item.line_id === lineId);
      if (existing) {
        return previous.map((item) => (item.line_id === lineId ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [
        ...previous,
        {
          line_id: lineId,
          dish_id: dish.id,
          dish_name: dish.name,
          unit_price: selection.unit_price,
          quantity: 1,
          variant_id: selection.variant_id,
          variant_name: selection.variant_name,
          addon_ids: selection.addon_ids,
          addon_names: selection.addon_names,
          addon_total: selection.addon_total,
          image_url: dish.image_url,
          is_veg: dish.is_veg,
        },
      ];
    });
  };

  const handleDishTap = (dish: DishWithRelations) => {
    const hasOptions = (dish.dish_variants?.length ?? 0) > 0 || (dish.dish_addons?.length ?? 0) > 0;
    if (hasOptions) {
      setOptionsDish(dish);
      return;
    }
    void commitSelection(dish, { variant_id: null, variant_name: null, unit_price: Number(dish.price), addon_ids: [], addon_names: [], addon_total: 0 });
  };

  const decrementDish = (dishId: string) => {
    const lines = items.filter((item) => item.dish_id === dishId);
    const last = lines[lines.length - 1];
    if (!last) return;
    if (last.quantity <= 1) {
      setItems(items.filter((item) => item.line_id !== last.line_id));
      return;
    }
    setItems(items.map((item) => (item.line_id === last.line_id ? { ...item, quantity: item.quantity - 1 } : item)));
  };

  const removeOrderItem = async (itemId: string) => {
    if (!selectedOrder) return;
    setBusyItemId(itemId);
    try {
      const response = await fetch(`/api/orders/${selectedOrder.id}/items?itemId=${itemId}`, { method: "DELETE" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to remove item");
      await refreshOrders();
      toast.success("Item removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to remove item");
    } finally {
      setBusyItemId(null);
    }
  };

  const tableStats = tableCounts(tables.data ?? []);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Waiter POS"
        description="Take new orders or add dishes to running tables."
        actions={
          tab === "new" ? (
            <Button disabled={!items.length || createOrder.isPending} onClick={() => createOrder.mutate()}>
              <Send className="h-4 w-4" />
              Send to kitchen
            </Button>
          ) : undefined
        }
      />
      <div className="flex gap-2">
        <Button variant={tab === "new" ? "default" : "outline"} size="sm" onClick={() => setTab("new")}>
          <PlusCircle className="h-4 w-4" />
          New order
        </Button>
        <Button variant={tab === "open" ? "default" : "outline"} size="sm" onClick={() => setTab("open")}>
          <ClipboardList className="h-4 w-4" />
          Open orders {openOrders.length ? `(${openOrders.length})` : ""}
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Available tables" value={tableStats.available} icon={Table2} tone="success" />
        <StatCard label="Occupied tables" value={tableStats.occupied} icon={Armchair} tone="warning" />
        <StatCard
          label={tab === "new" ? "Cart items" : "Open orders"}
          value={tab === "new" ? items.reduce((sum, item) => sum + item.quantity, 0) : openOrders.length}
          icon={ShoppingBag}
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4">
          <div className="grid gap-2 rounded-2xl border bg-card p-3 md:grid-cols-[220px_minmax(0,1fr)_220px]">
            {tab === "new" ? (
              <div className="flex gap-2">
                <Select className="w-32" value={orderMode} onChange={(event) => setOrderMode(event.target.value as OrderMode)}>
                  <option value="dine_in">Dine-in</option>
                  <option value="takeaway">Takeaway</option>
                  <option value="counter">Counter</option>
                </Select>
                {orderMode === "dine_in" ? (
                  <Select value={tableNumber?.toString() ?? ""} onChange={(event) => setTableNumber(event.target.value ? Number(event.target.value) : null)}>
                    <option value="">Table…</option>
                    {tables.data?.map((table) => (
                      <option key={table.id} value={table.table_number}>
                        T{table.table_number} {table.status !== "available" ? `(${table.status})` : ""}
                      </option>
                    ))}
                  </Select>
                ) : null}
              </div>
            ) : (
              <Select value={selectedOrderId ?? ""} onChange={(event) => setSelectedOrderId(event.target.value || null)}>
                <option value="">Pick open order…</option>
                {openOrders.map((order) => (
                  <option key={order.id} value={order.id}>
                    #{order.order_number} {order.table_number ? `· T${order.table_number}` : ""} · {formatCurrency(Number(order.total))}
                  </option>
                ))}
              </Select>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search dishes" value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <Select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
              <option value="all">All categories</option>
              {menu.data?.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>
          {menu.isLoading ? (
            <div className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-32" />
              ))}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {visibleDishes.map((dish) => (
                <DishTile
                  key={dish.id}
                  dish={dish}
                  quantity={tab === "new" ? items.filter((item) => item.dish_id === dish.id).reduce((sum, item) => sum + item.quantity, 0) : 0}
                  onAdd={() => handleDishTap(dish)}
                  onRemove={() => decrementDish(dish.id)}
                />
              ))}
            </div>
          )}
        </section>
        <aside className="space-y-3">
          {tab === "new" ? (
            <>
              <div className="space-y-3 rounded-2xl border bg-card p-4">
                <Input placeholder="Customer name optional" value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
                <Textarea placeholder="Order notes for kitchen" value={notes} onChange={(event) => setNotes(event.target.value)} />
              </div>
              <CartPanel
                items={items}
                subtotal={subtotal}
                tax={totals.tax}
                total={totals.total}
                submitLabel="Send to kitchen"
                submitting={createOrder.isPending}
                disabled={!branch}
                onIncrement={(lineId) => {
                  const line = items.find((item) => item.line_id === lineId);
                  if (line) setItems(items.map((item) => (item.line_id === lineId ? { ...item, quantity: item.quantity + 1 } : item)));
                }}
                onDecrement={(lineId) => {
                  const line = items.find((item) => item.line_id === lineId);
                  if (!line) return;
                  if (line.quantity <= 1) setItems(items.filter((item) => item.line_id !== lineId));
                  else setItems(items.map((item) => (item.line_id === lineId ? { ...item, quantity: item.quantity - 1 } : item)));
                }}
                onRemove={(lineId) => setItems(items.filter((item) => item.line_id !== lineId))}
                onNotes={(lineId, value) => setItems(items.map((item) => (item.line_id === lineId ? { ...item, notes: value } : item)))}
                onSubmit={() => createOrder.mutate()}
              />
            </>
          ) : selectedOrder ? (
            <Card className="sticky top-4">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-numbers text-sm font-semibold">#{selectedOrder.order_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedOrder.table_number ? `Table ${selectedOrder.table_number} · ` : ""}
                      {timeAgo(selectedOrder.created_at)}
                    </p>
                  </div>
                  <OrderStatusBadge status={selectedOrder.status} />
                </div>
                <div className="space-y-1.5">
                  {selectedOrder.order_items
                    .filter((item) => item.status !== "cancelled")
                    .map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-2 rounded-xl border bg-card px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm">
                            {item.quantity}× {item.dish_name}
                            {item.variant_name ? <span className="text-muted-foreground"> · {item.variant_name}</span> : null}
                          </p>
                          <p className="font-numbers text-[0.65rem] text-muted-foreground">
                            {formatCurrency(Number(item.price_at_order) + Number(item.addon_total ?? 0))} each
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-destructive"
                          disabled={busyItemId === item.id}
                          onClick={() => void removeOrderItem(item.id)}
                          aria-label={`Remove ${item.dish_name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                </div>
                <div className="flex items-center justify-between border-t pt-3">
                  <span className="text-sm font-medium">Total</span>
                  <span className="font-numbers text-sm font-semibold">{formatCurrency(Number(selectedOrder.total))}</span>
                </div>
                <Badge variant="secondary" className="w-full justify-center py-1.5">
                  Tap dishes on the left to add to this order
                </Badge>
              </CardContent>
            </Card>
          ) : (
            <EmptyState icon={ClipboardList} title="Pick an open order" description="Choose a running order to add or remove dishes." />
          )}
        </aside>
      </div>
      <DishOptionsDialog
        dish={optionsDish}
        open={!!optionsDish}
        onOpenChange={(open) => !open && setOptionsDish(null)}
        onConfirm={(selection) => {
          if (optionsDish) void commitSelection(optionsDish, selection);
        }}
      />
    </div>
  );
}

function tableCounts(tables: RestaurantTable[]) {
  return {
    available: tables.filter((table) => table.status === "available").length,
    occupied: tables.filter((table) => table.status === "occupied").length,
  };
}
