"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRealtimeOrders } from "@/hooks/use-realtime-orders";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { ITEM_STATUS, ITEM_STATUS_LABELS } from "@/lib/constants";
import { timeAgo } from "@/lib/helpers";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChefHat, Clock, Flame, CheckCircle2, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const ITEM_STATUS_FLOW = ["pending", "accepted", "preparing", "ready"];
const ITEM_COLORS: Record<string, string> = {
  pending: "border-yellow-500 bg-yellow-950/30",
  accepted: "border-blue-500 bg-blue-950/30",
  preparing: "border-orange-500 bg-orange-950/30",
  ready: "border-teal-500 bg-teal-950/30",
  served: "border-zinc-600 bg-zinc-900/30",
};

export default function KitchenPage() {
  const { branch } = useAuth();
  const { orders, isLoading } = useRealtimeOrders(branch?.id);
  const [supabase] = useState(() => createClient());
  const queryClient = useQueryClient();
  const prevOrderCount = useRef(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Audio alert for new orders
  useEffect(() => {
    if (orders && orders.length > prevOrderCount.current && prevOrderCount.current > 0 && soundEnabled) {
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 800;
        gain.gain.value = 0.3;
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } catch {}
    }
    prevOrderCount.current = orders?.length || 0;
  }, [orders?.length, soundEnabled]);

  const activeOrders = orders?.filter(o => ["confirmed", "preparing"].includes(o.status)) || [];

  const updateItemStatus = useMutation({
    mutationFn: async ({ itemId, status }: { itemId: string; status: string }) => {
      const { error } = await supabase.from("order_items").update({ status }).eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
    onError: (err: Error) => toast.error(err.message),
  });

  const getNextStatus = (current: string) => {
    const idx = ITEM_STATUS_FLOW.indexOf(current);
    return idx < ITEM_STATUS_FLOW.length - 1 ? ITEM_STATUS_FLOW[idx + 1] : null;
  };

  return (
    <div className="min-h-full bg-zinc-950 text-white -m-4 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ChefHat className="h-5 w-5 text-teal-400" />
          <h1 className="text-lg font-bold font-poppins text-white">Kitchen Display</h1>
          <Badge className="bg-teal-500/20 text-teal-400 text-[10px]">{activeOrders.length} active</Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className={`h-7 text-xs ${soundEnabled ? "text-teal-400" : "text-zinc-500"}`}
          onClick={() => setSoundEnabled(!soundEnabled)}
        >
          <Volume2 className="h-3.5 w-3.5 mr-1" /> Sound {soundEnabled ? "On" : "Off"}
        </Button>
      </div>

      {isLoading ? (
        <div className="text-zinc-500 text-center py-20">Loading orders...</div>
      ) : activeOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
          <ChefHat className="h-12 w-12 mb-3 text-zinc-700" />
          <p className="text-sm">No active orders</p>
          <p className="text-[10px]">Orders will appear here in real-time</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeOrders.map((order) => (
            <Card key={order.id} className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-teal-400">#{order.order_number}</span>
                    <Badge className="text-[9px] h-4 bg-zinc-800 text-zinc-300">
                      Table {order.table_number || "—"}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />{timeAgo(order.created_at)}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {order.order_items?.map((item: any) => {
                    const next = getNextStatus(item.status);
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-2 rounded border-l-2 ${ITEM_COLORS[item.status] || "border-zinc-700 bg-zinc-800/50"}`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-white">{item.quantity}× {item.dish_name}</span>
                          </div>
                          {item.notes && <p className="text-[9px] text-zinc-400 mt-0.5">{item.notes}</p>}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge className="text-[8px] h-3.5 bg-transparent border border-zinc-700 text-zinc-400">
                            {ITEM_STATUS_LABELS[item.status as keyof typeof ITEM_STATUS_LABELS] || item.status}
                          </Badge>
                          {next && (
                            <Button
                              size="sm"
                              className="h-6 text-[10px] px-2 bg-teal-600 hover:bg-teal-700 text-white"
                              onClick={() => updateItemStatus.mutate({ itemId: item.id, status: next })}
                              disabled={updateItemStatus.isPending}
                            >
                              {next === "accepted" && "Accept"}
                              {next === "preparing" && <><Flame className="h-2.5 w-2.5 mr-0.5" />Cook</>}
                              {next === "ready" && <><CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />Ready</>}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {order.notes && (
                  <p className="text-[10px] text-amber-400 mt-2 p-1.5 bg-amber-950/30 rounded">
                    Note: {order.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
