"use client";

import { Badge } from "@/components/ui/badge";
import { type OrderStatus } from "@/lib/constants";
import { useT } from "@/lib/i18n";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const t = useT();
  const variant = status === "ready" || status === "served" ? "success" : status === "pending" ? "warning" : status === "cancelled" ? "destructive" : "default";
  return <Badge variant={variant}>{t(`status.${status}`)}</Badge>;
}
