"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OrderWithItems = Record<string, any> & {
  id: string;
  order_number: string;
  branch_id: string;
  table_number?: number;
  status: string;
  notes?: string;
  created_at: string;
  order_items: Array<Record<string, any>>;
};

export function useRealtimeOrders(branchId: string | undefined) {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [supabase] = useState(() => createClient());

  const fetchOrders = useCallback(async () => {
    if (!branchId) return;
    setIsLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("branch_id", branchId)
      .in("status", ["pending", "confirmed", "preparing", "ready", "served"])
      .order("created_at", { ascending: false });

    if (data) setOrders(data as OrderWithItems[]);
    setIsLoading(false);
  }, [branchId, supabase]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (!branchId) return;

    const channel = supabase
      .channel(`orders-${branchId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `branch_id=eq.${branchId}`,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: RealtimePostgresChangesPayload<any>) => {
          if (payload.eventType === "INSERT") {
            // Fetch full order with items
            supabase
              .from("orders")
              .select("*, order_items(*)")
              .eq("id", payload.new.id)
              .single()
              .then(({ data }) => {
                if (data) {
                  setOrders((prev) => [data as OrderWithItems, ...prev]);
                }
              });
          } else if (payload.eventType === "UPDATE") {
            setOrders((prev) =>
              prev.map((order) =>
                order.id === payload.new.id
                  ? { ...order, ...payload.new }
                  : order
              )
            );
          } else if (payload.eventType === "DELETE" && payload.old) {
            setOrders((prev) =>
              prev.filter((order) => order.id !== (payload.old as any).id)
            );
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "order_items",
        },
        () => {
          // Refetch all orders when items update
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [branchId, supabase, fetchOrders]);

  return { orders, isLoading, refetch: fetchOrders };
}
