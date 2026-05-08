"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getOrdersWithItems } from "@/lib/supabase/queries";
import type { OrderItemStatus, OrderStatus } from "@/lib/constants";
import type { OrderWithItems } from "@/types/database";

export function useRealtimeOrders(branchId?: string | null) {
  const [supabase] = useState(() => createClient());
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activeRef = useRef(true);
  const branchRef = useRef<string | null | undefined>(branchId);
  const inFlightRef = useRef(false);
  const queuedRefreshRef = useRef(false);

  const refresh = useCallback(async () => {
    const currentBranchId = branchRef.current;
    if (!currentBranchId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    if (inFlightRef.current) {
      queuedRefreshRef.current = true;
      return;
    }

    inFlightRef.current = true;
    try {
      if (activeRef.current) {
        setLoading(true);
        setError(null);
      }
      const nextOrders = await getOrdersWithItems(supabase, currentBranchId);
      if (activeRef.current && branchRef.current === currentBranchId) setOrders(nextOrders);
    } catch (err) {
      if (activeRef.current) setError(err instanceof Error ? err.message : "Unable to load orders");
    } finally {
      inFlightRef.current = false;
      if (activeRef.current) setLoading(false);
      if (activeRef.current && queuedRefreshRef.current) {
        queuedRefreshRef.current = false;
        void refresh();
      }
    }
  }, [supabase]);

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
    activeRef.current = true;
    branchRef.current = branchId;
    queuedRefreshRef.current = false;
    void refresh();
    return () => {
      activeRef.current = false;
    };
  }, [branchId, refresh]);

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
