import Link from "next/link";
import { Compass } from "lucide-react";

/**
 * App-wide 404. Kept calm and useful — one clear way back, no mood.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Compass className="h-8 w-8" />
      </div>
      <div className="space-y-1.5">
        <p className="font-numbers text-3xl font-bold">404</p>
        <h1 className="text-lg font-semibold">This page doesn&apos;t exist</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          The link may be old or mistyped. Head back and pick up where you left off.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
      >
        Go to dashboard
      </Link>
    </main>
  );
}
