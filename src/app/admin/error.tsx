"use client";

import { RouteErrorState } from "@/components/ui/route-error";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteErrorState
      title="Platform console could not load"
      description="Retry the request or sign in with a platform admin account."
      reset={reset}
      homeHref="/dashboard"
      homeLabel="Dashboard"
      className="min-h-screen bg-background"
    />
  );
}
