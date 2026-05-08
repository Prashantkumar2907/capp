import { OrderCardSkeleton, PageHeaderSkeleton, StatGridSkeleton } from "@/components/ui/loading-patterns";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-5">
      <PageHeaderSkeleton />
      <StatGridSkeleton />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <OrderCardSkeleton key={index} />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}
