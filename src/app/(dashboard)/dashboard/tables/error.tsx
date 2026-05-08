"use client";

import { DashboardRouteError } from "@/components/ui/route-error";

export default function TablesError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <DashboardRouteError
      title="Tables could not load"
      description="Table statuses and QR details are temporarily unavailable. Retry before changing seating or QR setup."
      reset={reset}
    />
  );
}
