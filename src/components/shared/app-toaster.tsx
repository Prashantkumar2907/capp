"use client";

import { Toaster } from "sonner";
import { useHasMounted } from "@/hooks/use-has-mounted";

export function AppToaster() {
  const hasMounted = useHasMounted();

  if (!hasMounted) return null;

  return <Toaster richColors closeButton position="top-right" duration={2600} />;
}
