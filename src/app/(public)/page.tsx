import Link from "next/link";
import { ArrowRight, BarChart3, ChefHat, CreditCard, QrCode, Store, Users, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  { icon: QrCode, title: "QR table ordering", text: "Guests scan, browse, order, and pay without waiting for staff." },
  { icon: ChefHat, title: "Kitchen display", text: "Live order cards, prep timers, and clear stage changes for busy service." },
  { icon: CreditCard, title: "UPI-first payments", text: "Direct UPI QR for MVP and Razorpay webhooks when you need automation." },
  { icon: Users, title: "Real staff roles", text: "Owner, admin, manager, waiter, kitchen, and cashier views stay focused." },
  { icon: Store, title: "Multi-branch ready", text: "Compare branches, localize menus, and control access by location." },
  { icon: BarChart3, title: "Operational analytics", text: "Revenue, top dishes, peak hours, ratings, and branch performance." },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <UtensilsCrossed className="h-5 w-5" />
            </span>
            <span className="font-semibold">CAPP</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/sign-in">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Start free</Button>
            </Link>
          </div>
        </nav>
      </header>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1fr_420px] md:items-center md:py-20">
        <div>
          <Badge>Built for Indian restaurants</Badge>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
            Restaurant operating system for orders, kitchen, staff, payments, and growth.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            CAPP helps small restaurants move beyond paper registers without forcing enterprise complexity. Start with QR ordering and kitchen flow, then grow into multi-branch analytics.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/sign-up">
              <Button size="lg">
                Start your restaurant <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button variant="outline" size="lg">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
        <Card className="bg-card">
          <CardContent className="space-y-4 p-5">
            <div className="rounded-2xl border bg-secondary p-4">
              <p className="text-xs text-muted-foreground">Today</p>
              <p className="font-numbers mt-1 text-3xl font-semibold">Rs 48,720</p>
              <p className="mt-1 text-xs text-success">+18% vs last Thursday</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {["28 active orders", "6 tables waiting", "4 ready pickups", "92% paid"].map((item) => (
                <div key={item} className="rounded-2xl border bg-card p-3 text-sm font-medium">
                  {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-16 md:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title}>
            <CardContent className="p-5">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <feature.icon className="h-5 w-5" />
              </div>
              <h2 className="text-base font-semibold">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.text}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
