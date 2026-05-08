import { MenuTileSkeleton } from "@/components/ui/loading-patterns";
import { Skeleton } from "@/components/ui/skeleton";

export default function PublicOrderLoading() {
  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4">
          <Skeleton className="h-36 w-full" />
          <div className="flex gap-2 overflow-hidden">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-9 w-24 shrink-0" />
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <MenuTileSkeleton key={index} />
            ))}
          </div>
        </section>
        <aside className="hidden xl:block">
          <Skeleton className="h-[520px] w-full" />
        </aside>
      </div>
    </main>
  );
}
