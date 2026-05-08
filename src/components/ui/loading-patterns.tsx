import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="h-10 w-36" />
    </div>
  );
}

export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className="h-24" />
      ))}
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-44" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-4/5" />
        </div>
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

export function MenuTileSkeleton() {
  return (
    <Card>
      <CardContent className="flex gap-3 p-3">
        <Skeleton className="h-24 w-24 shrink-0" />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <div className="mt-auto flex items-center justify-between">
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ReceiptSkeleton() {
  return (
    <main className="min-h-screen bg-background px-4 py-5">
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-36 w-full" />
      </div>
    </main>
  );
}

export function DashboardRouteSkeleton({
  kind = "cards",
  stats = 4,
}: {
  kind?: "analytics" | "board" | "cards" | "form" | "menu" | "orders" | "table";
  stats?: number;
}) {
  return (
    <div className="space-y-5" role="status" aria-label="Loading dashboard page">
      <PageHeaderSkeleton />
      {stats > 0 ? <StatGridSkeleton count={stats} /> : null}
      {kind === "analytics" ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
          <Skeleton className="h-96" />
          <div className="space-y-3">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        </div>
      ) : null}
      {kind === "board" ? (
        <div className="grid gap-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="min-h-[480px]" />
          ))}
        </div>
      ) : null}
      {kind === "cards" ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-32" />
          ))}
        </div>
      ) : null}
      {kind === "form" ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Skeleton className="h-80" />
          <Skeleton className="h-96" />
        </div>
      ) : null}
      {kind === "menu" ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <MenuTileSkeleton key={index} />
          ))}
        </div>
      ) : null}
      {kind === "orders" ? (
        <div className="grid gap-3 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <OrderCardSkeleton key={index} />
          ))}
        </div>
      ) : null}
      {kind === "table" ? (
        <div className="rounded-2xl border bg-card p-3">
          <div className="mb-3 flex flex-wrap gap-2">
            <Skeleton className="h-10 min-w-64 flex-1" />
            <Skeleton className="h-10 w-48" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-16" />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
