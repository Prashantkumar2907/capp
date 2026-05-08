import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("relative overflow-hidden rounded-xl bg-muted skeleton-shine", className)} />;
}

export function SkeletonList({ count = 4, className, itemClassName }: { count?: number; className?: string; itemClassName?: string }) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className={cn("h-16", itemClassName)} />
      ))}
    </div>
  );
}
