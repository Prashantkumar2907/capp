"use client";

import { DashboardRouteError } from "@/components/ui/route-error";

export default function OrdersError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <DashboardRouteError
      title="Orders could not load"
      description="The order board could not refresh. Retry before changing order states or printing receipts."
      reset={reset}
    />
  );
}
