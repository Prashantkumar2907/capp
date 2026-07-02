"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRealtimeOrders } from "@/hooks/use-realtime-orders";
import { useOrderAlert } from "@/hooks/use-order-alert";
import { useSupabase } from "@/hooks/use-supabase";
import { useMutation } from "@tanstack/react-query";
import { SectionHeader } from "@/components/common/section-header";
import { EmptyState } from "@/components/common/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ChefHat, Clock, Check, ArrowRight, Volume2, VolumeX } from "lucide-react";
import { useState, useEffect } from "react";
import type { OrderItem } from "@/lib/supabase/types";

function getElapsedMinutes(created: string) {
  return Math.floor((Date.now() - new Date(created).getTime()) / 60000);
}

function getUrgencyColor(minutes: number) {
  if (minutes < 10) return { bg: "bg-green-50 dark:bg-green-950/20", text: "text-green-600 dark:text-green-400", border: "border-green-200 dark:border-green-800" };
  if (minutes < 20) return { bg: "bg-amber-50 dark:bg-amber-950/20", text: "text-amber-600 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800" };
  return { bg: "bg-red-50 dark:bg-red-950/20", text: "text-red-600 dark:text-red-400", border: "border-red-200 dark:border-red-800" };
}

export default function KitchenPage() {
  const { branch } = useAuth();
  const { orders, isLoading, refetch } = useRealtimeOrders(branch?.id);
  const supabase = useSupabase();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [, setTick] = useState(0);

  const kitchenOrders = orders?.filter(o => ["pending", "confirmed", "preparing", "ready"].includes(o.status)) || [];

  // Drive the useOrderAlert hook with the current kitchen queue size.
  useOrderAlert(kitchenOrders.filter(o => ["pending", "confirmed", "preparing"].includes(o.status)).length, soundEnabled);

  // Refresh timer display every 30s
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => { refetch(); toast.success("Updated"); },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Kitchen Display"
        description={`${kitchenOrders.length} active orders`}
        badge="KDS"
        actions={
          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setSoundEnabled(!soundEnabled)}>
            {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            {soundEnabled ? "Sound On" : "Sound Off"}
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : kitchenOrders.length === 0 ? (
        <EmptyState icon={ChefHat} title="All caught up!" description="No pending orders. New orders will appear here automatically." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kitchenOrders.map((order, i) => {
            const mins = getElapsedMinutes(order.created_at);
            const urgency = getUrgencyColor(mins);
            const nextStatus = order.status === "pending" ? "confirmed"
              : order.status === "confirmed" ? "preparing"
              : order.status === "preparing" ? "ready"
              : null;

            return (
              <motion.div key={order.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className={`overflow-hidden border-2 ${urgency.border}`}>
                  {/* Timer bar */}
                  <div className={`px-4 py-2.5 flex items-center justify-between ${urgency.bg}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-primary">#{order.order_number}</span>
                      {order.table_number && (
                        <Badge variant="outline" className="text-[10px] h-5">Table {order.table_number}</Badge>
                      )}
                    </div>
                    <div className={`flex items-center gap-1.5 text-sm font-bold ${urgency.text}`}>
                      <Clock className="h-4 w-4" />
                      {mins}m
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-3">
                    {/* Items */}
                    <div className="space-y-2">
                      {order.order_items?.map((item: OrderItem) => (
                        <div key={item.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                              {item.quantity}
                            </span>
                            <span className="text-sm font-medium">{item.dish_name}</span>
                          </div>
                          {item.notes && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full max-w-[120px] truncate">
                              {item.notes}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {order.notes && (
                      <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2 italic">
                        📝 {order.notes}
                      </div>
                    )}

                    {/* Action */}
                    {nextStatus ? (
                      <Button
                        className="w-full h-10 text-sm font-medium"
                        onClick={() => updateStatus.mutate({ orderId: order.id, status: nextStatus })}
                        disabled={updateStatus.isPending}
                      >
                        {nextStatus === "confirmed" ? "Accept Order" : nextStatus === "preparing" ? "Start Cooking" : "Mark Ready"}
                        <ArrowRight className="h-4 w-4 ml-1.5" />
                      </Button>
                    ) : (
                      <div className="flex items-center justify-center gap-2 py-2 text-sm font-medium text-green-600 dark:text-green-400">
                        <Check className="h-4 w-4" /> Ready for Pickup
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
