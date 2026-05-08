"use client";

import { DashboardRouteError } from "@/components/ui/route-error";

export default function WaiterError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <DashboardRouteError
      title="Waiter POS could not load"
      description="Menu, table, or cart context did not refresh. Retry before creating a new assisted order."
      reset={reset}
    />
  );
}
