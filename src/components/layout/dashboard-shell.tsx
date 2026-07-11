"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import {
  BarChart3,
  Bell,
  ChefHat,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  MoreHorizontal,
  Settings,
  ShoppingCart,
  Store,
  Sun,
  Table2,
  Users,
  UtensilsCrossed,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, initials } from "@/lib/utils";
import { roleLabels, roleAccess } from "@/lib/constants";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/features/auth/auth-provider";

const navItems: Array<{ href: string; label: string; icon: React.ComponentType<{ className?: string }>; resource: keyof typeof roleAccess }> = [
  { href: "/dashboard", label: "nav.counter", icon: LayoutDashboard, resource: "dashboard" },
  { href: "/dashboard/orders", label: "nav.orders", icon: ShoppingCart, resource: "orders" },
  { href: "/dashboard/kitchen", label: "nav.kitchen", icon: ChefHat, resource: "kitchen" },
  { href: "/dashboard/waiter", label: "nav.waiter", icon: ClipboardList, resource: "waiter" },
  { href: "/dashboard/payments", label: "nav.payments", icon: CreditCard, resource: "payments" },
  { href: "/dashboard/menu", label: "nav.menu", icon: UtensilsCrossed, resource: "menu" },
  { href: "/dashboard/tables", label: "nav.tables", icon: Table2, resource: "tables" },
  { href: "/dashboard/branches", label: "nav.branches", icon: Store, resource: "branches" },
  { href: "/dashboard/staff", label: "nav.staff", icon: Users, resource: "staff" },
  { href: "/dashboard/analytics", label: "nav.analytics", icon: BarChart3, resource: "analytics" },
  { href: "/dashboard/settings", label: "nav.settings", icon: Settings, resource: "settings" },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, staff, organization, branch, loading, role, roles, canAccess, signOut } = useAuth();
  const t = useT();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (!loading && !user) router.push(`/sign-in?redirect=${pathname}`);
    if (!loading && user && !staff) router.push("/onboarding");
  }, [loading, user, staff, router, pathname]);

  const visibleNav = useMemo(() => navItems.filter((item) => canAccess(item.resource)), [canAccess]);
  const page = visibleNav.find((item) => pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))) ?? visibleNav[0];

  if (loading || !user || !staff || !role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const sidebar = (
    <aside className="fill-container h-full border-r bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-3 border-b px-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <UtensilsCrossed className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{organization?.name ?? "CAPP"}</p>
          <p className="truncate text-[0.625rem] text-muted-foreground">{branch?.name ?? roleLabels[role]}</p>
        </div>
      </div>
      <nav className="scrollable-inner p-3">
        <div className="space-y-1">
          {visibleNav.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium transition-colors duration-150",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{t(item.label)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      <div className="border-t p-3">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground"
          onClick={async () => {
            await signOut();
            router.push("/sign-in");
          }}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden w-[260px] shrink-0 lg:block">{sidebar}</div>
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/40" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
          <div className="relative h-full w-[280px] animate-soft-rise">{sidebar}</div>
        </div>
      ) : null}
      <section className="fill-container min-w-0">
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background/90 px-3 backdrop-blur md:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{page ? t(page.label) : "Dashboard"}</p>
              <p className="hidden truncate text-xs text-muted-foreground sm:block">
                {roleSummary(role, roles)} at {branch?.name ?? organization?.name ?? "restaurant"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="secondary" className="hidden sm:inline-flex">
              {roleSummary(role, roles)}
            </Badge>
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Theme" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              <Sun className="h-4 w-4 dark:hidden" />
              <Moon className="hidden h-4 w-4 dark:block" />
            </Button>
            <div className="font-numbers flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {initials(staff.full_name)}
            </div>
          </div>
        </header>
        <main className="scrollable-inner p-3 md:p-5 3xl:p-7">{children}</main>
        <nav className="grid h-16 shrink-0 grid-cols-5 border-t bg-card lg:hidden">
          {visibleNav.slice(0, 4).map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={cn("flex flex-col items-center justify-center gap-1 text-[0.625rem]", active ? "text-primary" : "text-muted-foreground")}>
                <item.icon className="h-4 w-4" />
                {t(item.label)}
              </Link>
            );
          })}
          <button className="flex flex-col items-center justify-center gap-1 text-[0.625rem] text-muted-foreground" onClick={() => setMobileOpen(true)}>
            <MoreHorizontal className="h-4 w-4" />
            More
          </button>
        </nav>
      </section>
    </div>
  );
}

/**
 * Compact role display: "Owner" for one role, "Owner +2" when the person
 * wears several hats (the solo-operator case common in small restaurants).
 */
function roleSummary(primary: import("@/lib/constants").Role | null, roles: import("@/lib/constants").Role[]) {
  if (!primary) return "";
  const extra = roles.filter((held) => held !== primary).length;
  return extra > 0 ? `${roleLabels[primary]} +${extra}` : roleLabels[primary];
}
