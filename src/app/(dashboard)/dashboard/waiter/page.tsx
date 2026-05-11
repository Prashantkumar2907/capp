"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Armchair, Search, Send, ShoppingBag, Table2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { DishTile } from "@/components/features/menu/dish-tile";
import { CartPanel } from "@/components/features/cart/cart-panel";
import { createClient } from "@/lib/supabase/client";
import { getBranchMenu } from "@/lib/supabase/queries";
import { calculateTotals } from "@/lib/utils";
import { useAuth } from "@/features/auth/auth-provider";
import type { CartItem } from "@/stores/cart-store";
import type { RestaurantTable } from "@/types/database";

type WaiterDraft = {
  customerName: string;
  items: CartItem[];
  notes: string;
  tableNumber: number | null;
  version: 1;
};

export default function WaiterPage() {
  const { organization, branch } = useAuth();
  const [supabase] = useState(() => createClient());
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<CartItem[]>([]);
  const requestIdRef = useRef<string | null>(null);
  const submittingRef = useRef(false);
  const draftHydratedRef = useRef(false);
  const draftKey = branch?.id ? `capp-waiter-draft:${branch.id}` : null;

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

  const visibleDishes = useMemo(() => {
    return (menu.data?.dishes ?? []).filter((dish) => {
      if (!dish.is_active) return false;
      if (search && !dish.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (categoryId !== "all" && dish.category_id !== categoryId) return false;
      return true;
    });
  }, [categoryId, menu.data?.dishes, search]);

  const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const totals = calculateTotals(subtotal, Number(organization?.default_tax_percent ?? 5), Boolean(organization?.tax_inclusive ?? true));

  useEffect(() => {
    requestIdRef.current = null;
  }, [branch?.id, items, tableNumber]);

  useEffect(() => {
    draftHydratedRef.current = false;
    if (!draftKey) return;

    const draft = readWaiterDraft(draftKey);
    setCustomerName(draft?.customerName ?? "");
    setNotes(draft?.notes ?? "");
    setTableNumber(draft?.tableNumber ?? null);
    setItems(draft?.items ?? []);
    requestIdRef.current = null;
    draftHydratedRef.current = true;
  }, [draftKey]);

  useEffect(() => {
    if (!draftKey || !draftHydratedRef.current) return;

    const hasDraft = items.length || customerName.trim() || notes.trim() || tableNumber;
    if (!hasDraft) {
      clearWaiterDraft(draftKey);
      return;
    }

    const draft: WaiterDraft = {
      version: 1,
      customerName,
      notes,
      tableNumber,
      items,
    };
    writeWaiterDraft(draftKey, draft);
  }, [customerName, draftKey, items, notes, tableNumber]);

  const createOrder = useMutation({
    mutationFn: async () => {
      requestIdRef.current ??= `waiter:${branch!.id}:${crypto.randomUUID()}`;
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: branch!.id,
          tableNumber,
          clientRequestId: requestIdRef.current,
          customerName: customerName.trim() || undefined,
          orderSource: "waiter",
          orderType: tableNumber ? "dine_in" : "takeaway",
          notes: notes.trim() || undefined,
          items: items.map((item) => ({
            dish_id: item.dish_id,
            quantity: item.quantity,
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
      if (draftKey) clearWaiterDraft(draftKey);
      requestIdRef.current = null;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["tables"] }),
      ]);
      toast.success(order ? `Order #${order.order_number} sent` : "Order sent");
    },
    onError: (error) => toast.error(error.message),
    onSettled: () => {
      submittingRef.current = false;
    },
  });

  const submitOrder = () => {
    if (!items.length || !branch || createOrder.isPending || submittingRef.current) return;
    submittingRef.current = true;
    createOrder.mutate();
  };

  const addDish = (dishId: string) => {
    const dish = menu.data?.dishes.find((item) => item.id === dishId);
    if (!dish) return;
    const existing = items.find((item) => item.dish_id === dish.id);
    if (existing) {
      setItems(items.map((item) => (item.dish_id === dish.id ? { ...item, quantity: item.quantity + 1 } : item)));
      return;
    }
    setItems([...items, { dish_id: dish.id, dish_name: dish.name, unit_price: Number(dish.price), quantity: 1, image_url: dish.image_url, is_veg: dish.is_veg }]);
  };

  const decrement = (dishId: string) => {
    const existing = items.find((item) => item.dish_id === dishId);
    if (!existing) return;
    if (existing.quantity <= 1) {
      setItems(items.filter((item) => item.dish_id !== dishId));
      return;
    }
    setItems(items.map((item) => (item.dish_id === dishId ? { ...item, quantity: item.quantity - 1 } : item)));
  };

  const tableStats = tableCounts(tables.data ?? []);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Waiter POS"
        description="Create table orders quickly without leaving the dining floor."
        actions={
          <Button disabled={!items.length || createOrder.isPending} loading={createOrder.isPending} onClick={submitOrder}>
            <Send className="h-4 w-4" />
            Send to kitchen
          </Button>
        }
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Available tables" value={tableStats.available} icon={Table2} tone="success" />
        <StatCard label="Occupied tables" value={tableStats.occupied} icon={Armchair} tone="warning" />
        <StatCard label="Cart items" value={items.reduce((sum, item) => sum + item.quantity, 0)} icon={ShoppingBag} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4">
          <div className="grid gap-2 rounded-2xl border bg-card p-3 md:grid-cols-[220px_minmax(0,1fr)_220px]">
            <Select value={tableNumber?.toString() ?? ""} onChange={(event) => setTableNumber(event.target.value ? Number(event.target.value) : null)}>
              <option value="">Takeaway / no table</option>
              {tables.data?.map((table) => (
                <option key={table.id} value={table.table_number}>
                  Table {table.table_number} {table.status !== "available" ? `(${table.status})` : ""}
                </option>
              ))}
            </Select>
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
          ) : menu.error ? (
            <EmptyState icon={AlertCircle} title="Menu could not be loaded" description={menu.error.message} />
          ) : visibleDishes.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {visibleDishes.map((dish) => (
                <DishTile
                  key={dish.id}
                  dish={dish}
                  quantity={items.find((item) => item.dish_id === dish.id)?.quantity ?? 0}
                  onAdd={() => addDish(dish.id)}
                  onRemove={() => decrement(dish.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState icon={Search} title="No dishes found" description="Adjust the search or category filter." />
          )}
        </section>
        <aside className="space-y-3">
          <div className="space-y-3 rounded-2xl border bg-card p-4">
            <Input aria-label="Customer name optional" placeholder="Customer name optional" value={customerName} maxLength={80} onChange={(event) => setCustomerName(event.target.value)} />
            <Textarea aria-label="Order notes for kitchen" placeholder="Order notes for kitchen" value={notes} maxLength={500} onChange={(event) => setNotes(event.target.value)} />
            {items.length ? <p className="text-xs text-muted-foreground">Draft saved on this device for this branch.</p> : null}
          </div>
          <CartPanel
            items={items}
            subtotal={subtotal}
            tax={totals.tax}
            total={totals.total}
            submitLabel="Send to kitchen"
            submitting={createOrder.isPending}
            disabled={!branch}
            onIncrement={addDish}
            onDecrement={decrement}
            onRemove={(dishId) => setItems(items.filter((item) => item.dish_id !== dishId))}
            onNotes={(dishId, value) => setItems(items.map((item) => (item.dish_id === dishId ? { ...item, notes: value } : item)))}
            onSubmit={submitOrder}
          />
        </aside>
      </div>
    </div>
  );
}

function tableCounts(tables: RestaurantTable[]) {
  return {
    available: tables.filter((table) => table.status === "available").length,
    occupied: tables.filter((table) => table.status === "occupied").length,
  };
}

function readWaiterDraft(key: string): WaiterDraft | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WaiterDraft>;
    if (parsed.version !== 1 || !Array.isArray(parsed.items)) return null;

    return {
      version: 1,
      customerName: typeof parsed.customerName === "string" ? parsed.customerName : "",
      notes: typeof parsed.notes === "string" ? parsed.notes : "",
      tableNumber: typeof parsed.tableNumber === "number" ? parsed.tableNumber : null,
      items: parsed.items.filter((item): item is CartItem => Boolean(item?.dish_id && item.dish_name && item.quantity)),
    };
  } catch {
    return null;
  }
}

function writeWaiterDraft(key: string, draft: WaiterDraft) {
  try {
    localStorage.setItem(key, JSON.stringify(draft));
  } catch {
    // Draft persistence is a convenience; blocked storage should not interrupt POS work.
  }
}

function clearWaiterDraft(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage failures in private or locked-down browser contexts.
  }
}
