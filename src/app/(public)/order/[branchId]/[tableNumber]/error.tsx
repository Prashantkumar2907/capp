"use client";

import { PublicRouteError } from "@/components/ui/route-error";

export default function PublicOrderError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <PublicRouteError
      title="Menu could not load"
      description="We could not load this table menu. Check the QR code or connection, then retry."
      reset={reset}
    />
  );
}
