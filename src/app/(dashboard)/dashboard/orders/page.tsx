"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRealtimeOrders } from "@/hooks/use-realtime-orders";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatTime, timeAgo } from "@/lib/helpers";
import { ORDER_STATUS, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, ITEM_STATUS_LABELS } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Clock, ChevronRight } from "lucide-react";

const KANBAN_COLUMNS = [
  { status: "pending", label: "Pending" },
  { status: "confirmed", label: "Confirmed" },
  { status: "preparing", label: "Preparing" },
  { status: "ready", label: "Ready" },
  { status: "served", label: "Served" },
];

export default function OrdersPage() {
  const { branch } = useAuth();
  const { orders, isLoading, refetch } = useRealtimeOrders(branch?.id);
  const supabase = createClient();

  const updateStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      refetch();
      toast.success("Order updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const getNextStatus = (current: string) => {
    const flow = ["pending", "confirmed", "preparing", "ready", "served"];
    const idx = flow.indexOf(current);
    return idx < flow.length - 1 ? flow[idx + 1] : null;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold font-poppins">Orders</h1>
        <div className="grid grid-cols-5 gap-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-32 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-poppins">Orders</h1>
        <Badge variant="outline" className="text-xs">{orders.length} active</Badge>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {KANBAN_COLUMNS.map((col) => {
          const columnOrders = orders.filter((o) => o.status === col.status);
          return (
            <div key={col.status}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {col.label}
                </h3>
                <Badge variant="secondary" className="text-[9px] h-4">{columnOrders.length}</Badge>
              </div>
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="space-y-2 pr-2">
                  {columnOrders.map((order) => {
                    const next = getNextStatus(order.status);
                    return (
                      <Card key={order.id} className="border-zinc-200 dark:border-zinc-800">
                        <CardContent className="p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                              #{order.order_number}
                            </span>
                            <Badge className={`text-[9px] h-4 ${ORDER_STATUS_COLORS[order.status] || ""}`}>
                              {ORDER_STATUS_LABELS[order.status]}
                            </Badge>
                          </div>

                          {order.table_number && (
                            <p className="text-[10px] text-zinc-500">Table {order.table_number}</p>
                          )}

                          {/* Items */}
                          <div className="space-y-0.5">
                            {order.order_items?.slice(0, 4).map((item) => (
                              <div key={item.id} className="flex items-center justify-between text-[10px]">
                                <span className="truncate flex-1">{item.quantity}x {item.dish_name}</span>
                                <Badge variant="outline" className="text-[8px] h-3.5 ml-1">{ITEM_STATUS_LABELS[item.status] || item.status}</Badge>
                              </div>
                            ))}
                            {(order.order_items?.length || 0) > 4 && (
                              <p className="text-[9px] text-zinc-400">+{order.order_items.length - 4} more</p>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                              <Clock className="h-2.5 w-2.5" />
                              {timeAgo(order.created_at)}
                            </div>
                            <span className="text-xs font-semibold">{formatCurrency(order.total)}</span>
                          </div>

                          {next && (
                            <Button
                              size="sm"
                              className="w-full bg-teal-500 hover:bg-teal-600 text-white h-7 text-[10px]"
                              onClick={() => updateStatus.mutate({ orderId: order.id, status: next })}
                              disabled={updateStatus.isPending}
                            >
                              Move to {ORDER_STATUS_LABELS[next]} <ChevronRight className="h-3 w-3 ml-0.5" />
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                  {columnOrders.length === 0 && (
                    <div className="text-center py-6 text-[10px] text-zinc-400">No orders</div>
                  )}
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>
    </div>
  );
}
