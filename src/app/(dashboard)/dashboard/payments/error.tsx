"use client";

import { DashboardRouteError } from "@/components/ui/route-error";

export default function PaymentsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <DashboardRouteError
      title="Payments could not load"
      description="Settlement and retry status are temporarily unavailable. Retry before marking an order paid or refunded."
      reset={reset}
    />
  );
}
