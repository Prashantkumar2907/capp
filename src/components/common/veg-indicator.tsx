import { cn } from "@/lib/utils";

interface VegIndicatorProps {
  isVeg: boolean;
  className?: string;
  dotClassName?: string;
}

export function VegIndicator({
  isVeg,
  className,
  dotClassName,
}: VegIndicatorProps) {
  return (
    <span
      aria-label={isVeg ? "Vegetarian" : "Non-vegetarian"}
      title={isVeg ? "Vegetarian" : "Non-vegetarian"}
      className={cn(
        "inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border",
        isVeg ? "border-green-500" : "border-red-500",
        className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          isVeg ? "bg-green-500" : "bg-red-500",
          dotClassName
        )}
      />
    </span>
  );
}
