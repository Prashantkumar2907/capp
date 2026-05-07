"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  LayoutDashboard, ShoppingCart, ChefHat, UtensilsCrossed, Users,
  BarChart3, CreditCard, Settings, LogOut, Store, MapPin, ClipboardList,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: React.ComponentType<any>; roles?: string[] };

const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart, roles: ["owner", "admin", "manager", "waiter", "cashier"] },
      { href: "/dashboard/kitchen", label: "Kitchen", icon: ChefHat, roles: ["owner", "admin", "manager", "kitchen"] },
      { href: "/dashboard/waiter", label: "Waiter", icon: ClipboardList, roles: ["owner", "admin", "manager", "waiter"] },
      { href: "/dashboard/payments", label: "Payments", icon: CreditCard, roles: ["owner", "admin", "manager", "cashier"] },
    ],
  },
  {
    label: "Management",
    items: [
      { href: "/dashboard/menu", label: "Menu", icon: UtensilsCrossed, roles: ["owner", "admin", "manager"] },
      { href: "/dashboard/tables", label: "Tables", icon: MapPin, roles: ["owner", "admin", "manager"] },
      { href: "/dashboard/branches", label: "Branches", icon: Store, roles: ["owner", "admin"] },
      { href: "/dashboard/staff", label: "Staff", icon: Users, roles: ["owner", "admin"] },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { staff, organization } = useAuth();
  const role = staff?.role || "waiter";

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.push("/sign-in");
  };

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[260px] flex-col bg-card border-r border-border z-40">
      {/* Brand */}
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-border shrink-0">
        <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
          <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold truncate">{organization?.name || "RestaurantOS"}</p>
          <p className="text-[10px] text-muted-foreground truncate">{staff?.role ? staff.role.charAt(0).toUpperCase() + staff.role.slice(1) : ""}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-hide">
        {NAV_SECTIONS.map((section) => {
          const visibleItems = section.items.filter(
            (item) => !item.roles || item.roles.includes(role)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.label}>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active-pill"
                          className="absolute inset-0 bg-primary/10 rounded-lg"
                          transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        />
                      )}
                      <item.icon className={cn("relative h-4 w-4 shrink-0 z-10", isActive && "text-primary")} />
                      <span className="relative z-10">{item.label}</span>
                      {isActive && (
                        <div className="relative z-10 ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border p-3 space-y-1 shrink-0">
        <Link
          href="/dashboard/settings"
          className={cn(
            "relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            pathname === "/dashboard/settings"
              ? "text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {pathname === "/dashboard/settings" && (
            <motion.div
              layoutId="sidebar-active-pill"
              className="absolute inset-0 bg-primary/10 rounded-lg"
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
            />
          )}
          <Settings className="relative h-4 w-4 z-10" />
          <span className="relative z-10">Settings</span>
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
