"use client";

import { Clock, ReceiptText, Table2, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/shared/status-badge";
import { orderStatusFlow, orderStatusLabels, type OrderStatus } from "@/lib/constants";
import { cn, formatCurrency, timeAgo } from "@/lib/utils";
import type { OrderWithItems } from "@/types/database";

interface OrderCardProps {
  order: OrderWithItems;
  busy?: boolean;
  compact?: boolean;
  onStatusChange?: (status: OrderStatus) => void;
  onCancel?: () => void;
  actionLabel?: string;
  className?: string;
}

export function OrderCard({ order, busy, compact, onStatusChange, onCancel, actionLabel, className }: OrderCardProps) {
  const nextStatus = nextOrderStatus(order.status);
  const canCancel = onCancel && !["served", "cancelled"].includes(order.status);

  return (
    <Card className={cn("transition-colors duration-150 hover:border-primary/40", className)}>
      <CardContent className={cn("space-y-4 p-4", compact && "space-y-3 p-3")}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-numbers text-sm font-semibold">#{order.order_number}</p>
              <OrderStatusBadge status={order.status} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {timeAgo(order.created_at)}
              </span>
              {order.table_number ? (
                <span className="inline-flex items-center gap-1">
                  <Table2 className="h-3.5 w-3.5" />
                  Table {order.table_number}
                </span>
              ) : null}
              {order.customer_name ? (
                <span className="inline-flex items-center gap-1">
                  <UserRound className="h-3.5 w-3.5" />
                  {order.customer_name}
                </span>
              ) : null}
            </div>
          </div>
          <div className="text-right">
            <p className="font-numbers text-sm font-semibold">{formatCurrency(order.total)}</p>
            <p className="mt-1 text-[0.625rem] uppercase tracking-[0.08em] text-muted-foreground">{order.order_source.replace("_", " ")}</p>
          </div>
        </div>
        <div className="space-y-2">
          {order.order_items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-3 rounded-xl bg-secondary/70 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">{item.dish_name}</p>
                {item.notes ? <p className="mt-0.5 truncate text-[0.625rem] text-muted-foreground">{item.notes}</p> : null}
              </div>
              <div className="font-numbers shrink-0 text-xs text-muted-foreground">x{item.quantity}</div>
            </div>
          ))}
        </div>
        {order.notes ? (
          <div className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
            <ReceiptText className="mr-1 inline h-3.5 w-3.5" />
            {order.notes}
          </div>
        ) : null}
        {(nextStatus && onStatusChange) || canCancel ? (
          <div className="flex gap-2">
            {nextStatus && onStatusChange ? (
              <Button className="flex-1" disabled={busy} onClick={() => onStatusChange(nextStatus)}>
                {actionLabel ?? `Mark ${orderStatusLabels[nextStatus]}`}
              </Button>
            ) : null}
            {canCancel ? (
              <Button variant="outline" size="icon" disabled={busy} onClick={onCancel} title="Cancel order" aria-label="Cancel order">
                <X className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function nextOrderStatus(status: OrderStatus) {
  const index = orderStatusFlow.indexOf(status);
  if (index === -1 || index === orderStatusFlow.length - 1) return null;
  return orderStatusFlow[index + 1];
}
