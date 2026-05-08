"use client";

import { DashboardRouteError } from "@/components/ui/route-error";

export default function AnalyticsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <DashboardRouteError
      title="Analytics could not load"
      description="Revenue, source mix, and feedback trends are temporarily unavailable. Retry without changing filters or branch context."
      reset={reset}
    />
  );
}
