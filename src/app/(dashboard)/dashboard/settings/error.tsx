"use client";

import { DashboardRouteError } from "@/components/ui/route-error";

export default function SettingsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <DashboardRouteError
      title="Settings could not load"
      description="Business configuration did not refresh. Retry before changing taxes, service charges, hours, or receipt settings."
      reset={reset}
    />
  );
}
