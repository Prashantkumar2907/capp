"use client";

import { DashboardRouteError } from "@/components/ui/route-error";

export default function BranchesError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <DashboardRouteError
      title="Branches could not load"
      description="Branch settings and operating details did not refresh. Retry before making location or QR changes."
      reset={reset}
    />
  );
}
