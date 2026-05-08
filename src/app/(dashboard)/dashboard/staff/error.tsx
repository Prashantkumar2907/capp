"use client";

import { DashboardRouteError } from "@/components/ui/route-error";

export default function StaffError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <DashboardRouteError
      title="Staff could not load"
      description="Staff roles, access status, or branch assignments did not refresh. Retry before inviting or disabling staff."
      reset={reset}
    />
  );
}
