"use client";

import { DashboardRouteError } from "@/components/ui/route-error";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <DashboardRouteError
      title="Dashboard could not load"
      description="We could not refresh your restaurant summary. Retry the request or return to the dashboard once the connection is stable."
      reset={reset}
    />
  );
}
