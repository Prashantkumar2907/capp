"use client";

import { DashboardRouteError } from "@/components/ui/route-error";

export default function KitchenError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <DashboardRouteError
      title="Kitchen board could not load"
      description="Active tickets are temporarily unavailable. Retry before progressing orders so station state stays accurate."
      reset={reset}
    />
  );
}
