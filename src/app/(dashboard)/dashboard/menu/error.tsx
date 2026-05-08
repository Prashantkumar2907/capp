"use client";

import { DashboardRouteError } from "@/components/ui/route-error";

export default function MenuError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <DashboardRouteError
      title="Menu editor could not load"
      description="Menu items, categories, or branch availability did not refresh. Retry before changing prices or availability."
      reset={reset}
    />
  );
}
