import { Skeleton } from "@/components/ui/skeleton";

export default function PublicPaymentLoading() {
  return (
    <main className="min-h-screen bg-background px-4 py-5">
      <div className="mx-auto grid max-w-5xl gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-72 w-full" />
        </section>
        <Skeleton className="h-[520px] w-full" />
      </div>
    </main>
  );
}
