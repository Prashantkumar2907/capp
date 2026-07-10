import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  orderStatusColors,
  orderStatusLabels,
  paymentStatusLabels,
  itemStatusLabels,
} from "@/lib/constants";

type StatusVariant = "order" | "payment" | "item";

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  className?: string;
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
  refunded: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
};

const ITEM_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-blue-100 text-blue-800",
  preparing: "bg-orange-100 text-orange-800",
  ready: "bg-green-100 text-green-800",
  served: "bg-purple-100 text-purple-800",
  cancelled: "bg-red-100 text-red-800",
};

function getConfig(variant: StatusVariant, status: string) {
  switch (variant) {
    case "payment":
      return {
        color: PAYMENT_STATUS_COLORS[status] ?? "",
        label: paymentStatusLabels[status as keyof typeof paymentStatusLabels] ?? status,
      };
    case "item":
      return {
        color: ITEM_STATUS_COLORS[status] ?? "",
        label: itemStatusLabels[status as keyof typeof itemStatusLabels] ?? status,
      };
    default:
      return {
        color: orderStatusColors[status as keyof typeof orderStatusColors] ?? "",
        label: orderStatusLabels[status as keyof typeof orderStatusLabels] ?? status,
      };
  }
}

/**
 * Unified status badge that handles order, payment, and item status display
 * with consistent coloring derived from the constants map.
 */
export function StatusBadge({ status, variant = "order", className }: StatusBadgeProps) {
  const { color, label } = getConfig(variant, status);
  return (
    <Badge className={cn("text-[10px] h-5 capitalize border-0", color, className)}>
      {label}
    </Badge>
  );
}
