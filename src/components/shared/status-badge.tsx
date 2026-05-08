import { Badge } from "@/components/ui/badge";
import { orderStatusLabels, type OrderStatus } from "@/lib/constants";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const variant =
    status === "ready" || status === "served" || status === "paid"
      ? "success"
      : status === "pending"
        ? "warning"
        : status === "cancelled" || status === "failed" || status === "refunded"
          ? "destructive"
          : "default";
  return <Badge variant={variant}>{orderStatusLabels[status]}</Badge>;
}
