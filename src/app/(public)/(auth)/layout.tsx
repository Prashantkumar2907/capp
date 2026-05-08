import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,1fr)_minmax(420px,520px)]">
      <section className="hidden flex-col justify-between bg-[linear-gradient(135deg,#10241f,#128c7e_58%,#ffd178)] p-10 text-white lg:flex">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
            <UtensilsCrossed className="h-6 w-6" />
          </span>
          <span className="text-lg font-semibold">CAPP</span>
        </Link>
        <div className="max-w-xl">
          <p className="text-sm uppercase tracking-[0.28em] text-white/70">Restaurant command center</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight">Run ordering, kitchen, tables, payments, and staff from one calm dashboard.</h1>
          <p className="mt-4 text-base text-white/75">Built for restaurants that need speed during service and clarity after closing.</p>
        </div>
        <p className="text-xs text-white/60">QR ordering. Real-time kitchen. UPI-first payments.</p>
      </section>
      <section className="flex min-h-screen items-center justify-center p-5">
        <div className="w-full max-w-md">{children}</div>
      </section>
    </main>
  );
}
