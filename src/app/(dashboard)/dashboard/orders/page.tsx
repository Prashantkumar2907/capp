"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRealtimeOrders } from "@/hooks/use-realtime-orders";
import { useOrderAlert } from "@/hooks/use-order-alert";
import { useSupabase } from "@/hooks/use-supabase";
import { useMutation } from "@tanstack/react-query";
import { formatCurrency, timeAgo } from "@/lib/helpers";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { SectionHeader } from "@/components/common/section-header";
import { EmptyState } from "@/components/common/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Clock, ChevronRight, ShoppingCart, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import type { OrderItem } from "@/lib/supabase/types";

const KANBAN_COLUMNS = [
  { status: "pending", label: "Pending", color: "border-amber-400", bg: "bg-amber-400" },
  { status: "confirmed", label: "Confirmed", color: "border-blue-400", bg: "bg-blue-400" },
  { status: "preparing", label: "Preparing", color: "border-orange-400", bg: "bg-orange-400" },
  { status: "ready", label: "Ready", color: "border-green-400", bg: "bg-green-400" },
  { status: "served", label: "Served", color: "border-muted-foreground", bg: "bg-muted-foreground" },
];

function getTimeColor(createdAt: string) {
  const mins = (Date.now() - new Date(createdAt).getTime()) / 60000;
  if (mins < 10) return "text-green-600 dark:text-green-400";
  if (mins < 20) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export default function OrdersPage() {
  const { branch } = useAuth();
  const { orders, isLoading, refetch } = useRealtimeOrders(branch?.id);
  const supabase = useSupabase();
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Centralised sound alert — fires when active order count increases.
  useOrderAlert(orders?.length ?? 0, soundEnabled);

  const updateStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => { refetch(); toast.success("Order updated"); },
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
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-5 gap-3">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-[400px] rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Orders"
        description={`${orders.length} active orders`}
        actions={
          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5"
            onClick={() => setSoundEnabled(!soundEnabled)}>
            {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            Sound {soundEnabled ? "On" : "Off"}
          </Button>
        }
      />

      {/* Kanban Board */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {KANBAN_COLUMNS.map((col) => {
          const columnOrders = orders.filter((o) => o.status === col.status);
          return (
            <div key={col.status} className="min-h-[200px]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${col.bg}`} />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {col.label}
                  </h3>
                </div>
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{columnOrders.length}</Badge>
              </div>
              <ScrollArea className="h-[calc(100vh-240px)]">
                <div className="space-y-2.5 pr-1">
                  {columnOrders.map((order, i) => {
                    const next = getNextStatus(order.status);
                    return (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Card className={`border-l-[3px] ${col.color} overflow-hidden card-hover`}>
                          <CardContent className="p-3 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-primary">#{order.order_number}</span>
                              <Badge variant="outline" className="text-[9px] h-4">
                                {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] || order.status}
                              </Badge>
                            </div>

                            {order.table_number && (
                              <p className="text-[10px] text-muted-foreground">Table {order.table_number}</p>
                            )}

                            {/* Items */}
                            <div className="space-y-1">
                              {order.order_items?.slice(0, 4).map((item: OrderItem) => (
                                <div key={item.id} className="flex items-center justify-between text-[11px]">
                                  <span className="truncate flex-1 text-muted-foreground">
                                    <span className="font-medium text-foreground">{item.quantity}×</span> {item.dish_name}
                                  </span>
                                </div>
                              ))}
                              {(order.order_items?.length || 0) > 4 && (
                                <p className="text-[10px] text-muted-foreground">+{order.order_items.length - 4} more</p>
                              )}
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-border">
                              <div className={`flex items-center gap-1 text-[10px] font-medium ${getTimeColor(order.created_at)}`}>
                                <Clock className="h-2.5 w-2.5" />
                                {timeAgo(order.created_at)}
                              </div>
                              <span className="text-xs font-bold">{formatCurrency(Number(order.total))}</span>
                            </div>

                            {next && (
                              <Button
                                size="sm"
                                className="w-full h-7 text-[10px] mt-1"
                                onClick={() => updateStatus.mutate({ orderId: order.id, status: next })}
                                disabled={updateStatus.isPending}
                              >
                                {ORDER_STATUS_LABELS[next as keyof typeof ORDER_STATUS_LABELS] || next}
                                <ChevronRight className="h-3 w-3 ml-0.5" />
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                  {columnOrders.length === 0 && (
                    <div className="flex items-center justify-center py-12 text-[10px] text-muted-foreground">
                      No orders
                    </div>
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
