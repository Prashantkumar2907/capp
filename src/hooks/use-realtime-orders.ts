"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getOrdersWithItems } from "@/lib/supabase/queries";
import type { OrderItemStatus, OrderStatus } from "@/lib/constants";
import type { OrderWithItems } from "@/types/database";

export function useRealtimeOrders(branchId?: string | null) {
  const [supabase] = useState(() => createClient());
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!branchId) return;
    try {
      setLoading(true);
      setError(null);
      setOrders(await getOrdersWithItems(supabase, branchId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load orders");
    } finally {
      setLoading(false);
    }
  }, [branchId, supabase]);

  const applyStatusUpdate = useCallback((orderId: string, status: OrderStatus, itemStatus?: OrderItemStatus | null) => {
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status,
              order_items: itemStatus ? order.order_items.map((item) => ({ ...item, status: itemStatus })) : order.order_items,
            }
          : order
      )
    );
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!branchId) return;

    const channel = supabase
      .channel(`orders:${branchId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `branch_id=eq.${branchId}` }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items", filter: `branch_id=eq.${branchId}` }, () => void refresh())
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [branchId, refresh, supabase]);

  return { orders, loading, error, refresh, applyStatusUpdate };
}
