import { DashboardRouteSkeleton } from "@/components/ui/loading-patterns";

export default function Loading() {
  return <DashboardRouteSkeleton kind="cards" stats={0} />;
}
