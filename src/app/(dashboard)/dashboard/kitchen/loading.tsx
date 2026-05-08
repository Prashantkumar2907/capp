import { DashboardRouteSkeleton } from "@/components/ui/loading-patterns";

export default function Loading() {
  return <DashboardRouteSkeleton kind="board" stats={3} />;
}
