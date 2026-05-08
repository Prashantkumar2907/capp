"use client";

import { PublicRouteError } from "@/components/ui/route-error";

export default function ReceiptError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <PublicRouteError
      title="Receipt could not load"
      description="We could not load this receipt right now. Retry from the receipt link or ask staff to reprint it."
      reset={reset}
    />
  );
}
