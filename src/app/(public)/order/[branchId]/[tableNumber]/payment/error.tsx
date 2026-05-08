"use client";

import { PublicRouteError } from "@/components/ui/route-error";

export default function PublicPaymentError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <PublicRouteError
      title="Order review could not load"
      description="We could not recover this saved cart or branch details. Retry before placing the order."
      reset={reset}
    />
  );
}
