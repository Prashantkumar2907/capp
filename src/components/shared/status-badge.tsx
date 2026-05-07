import { Badge } from "@/components/ui/badge";
import { orderStatusLabels, type OrderStatus } from "@/lib/constants";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const variant = status === "ready" || status === "served" ? "success" : status === "pending" ? "warning" : status === "cancelled" ? "destructive" : "default";
  return <Badge variant={variant}>{orderStatusLabels[status]}</Badge>;
}
