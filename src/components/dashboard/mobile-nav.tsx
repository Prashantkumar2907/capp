"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, ShoppingCart, UtensilsCrossed, ChefHat, MoreHorizontal,
  MapPin, Users, BarChart3, CreditCard, Settings, ClipboardList, Store,
} from "lucide-react";
import { useState } from "react";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

// Role-specific main tabs (max 4 before "More")
const ROLE_MAIN_TABS: Record<string, NavItem[]> = {
  owner:   [{ href: "/dashboard", label: "Home", icon: LayoutDashboard }, { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart }, { href: "/dashboard/kitchen", label: "Kitchen", icon: ChefHat }, { href: "/dashboard/menu", label: "Menu", icon: UtensilsCrossed }],
  admin:   [{ href: "/dashboard", label: "Home", icon: LayoutDashboard }, { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart }, { href: "/dashboard/kitchen", label: "Kitchen", icon: ChefHat }, { href: "/dashboard/menu", label: "Menu", icon: UtensilsCrossed }],
  manager: [{ href: "/dashboard", label: "Home", icon: LayoutDashboard }, { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart }, { href: "/dashboard/kitchen", label: "Kitchen", icon: ChefHat }, { href: "/dashboard/waiter", label: "Waiter", icon: ClipboardList }],
  waiter:  [{ href: "/dashboard", label: "Home", icon: LayoutDashboard }, { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart }, { href: "/dashboard/waiter", label: "Waiter", icon: ClipboardList }, { href: "/dashboard/tables", label: "Tables", icon: MapPin }],
  kitchen: [{ href: "/dashboard", label: "Home", icon: LayoutDashboard }, { href: "/dashboard/kitchen", label: "Kitchen", icon: ChefHat }, { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart }],
  cashier: [{ href: "/dashboard", label: "Home", icon: LayoutDashboard }, { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart }, { href: "/dashboard/payments", label: "Payments", icon: CreditCard }],
};

const MORE_ITEMS: NavItem[] = [
  { href: "/dashboard/waiter", label: "Waiter", icon: ClipboardList },
  { href: "/dashboard/tables", label: "Tables", icon: MapPin },
  { href: "/dashboard/branches", label: "Branches", icon: Store },
  { href: "/dashboard/staff", label: "Staff", icon: Users },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();
  const { staff } = useAuth();
  const [showMore, setShowMore] = useState(false);
  const role = (staff?.role || "waiter") as keyof typeof ROLE_MAIN_TABS;

  const mainTabs = ROLE_MAIN_TABS[role] ?? ROLE_MAIN_TABS.waiter;

  // More items: those NOT already in mainTabs for this role
  const mainHrefs = new Set(mainTabs.map((t) => t.href));
  const moreItems = MORE_ITEMS.filter((i) => !mainHrefs.has(i.href));

  const isMoreActive = moreItems.some(
    (i) => pathname === i.href || pathname.startsWith(i.href + "/")
  );

  return (
    <>
      {/* More menu overlay */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            key="more-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="lg:hidden fixed inset-0 z-40"
            onClick={() => setShowMore(false)}
          >
            <div className="absolute inset-0 bg-black/40" />
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              className="absolute bottom-16 left-0 right-0 bg-card border-t border-border rounded-t-2xl p-4 safe-area-bottom"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="h-1 w-8 bg-muted-foreground/30 rounded-full mx-auto mb-4" />
              <div className="grid grid-cols-4 gap-3">
                {moreItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setShowMore(false)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors",
                        isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="text-[10px] font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom tab bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border">
        <div className="flex items-center justify-around h-16 px-2 safe-area-bottom">
          {mainTabs.map((tab) => {
            const isActive = pathname === tab.href || (tab.href !== "/dashboard" && pathname.startsWith(tab.href));
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-xl transition-colors min-w-[56px]",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-pill"
                    className="absolute inset-0 bg-primary/8 rounded-xl"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <tab.icon className={cn("relative h-5 w-5", isActive && "text-primary")} />
                <span className={cn("relative text-[10px]", isActive ? "font-semibold" : "font-medium")}>
                  {tab.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-dot"
                    className="h-0.5 w-4 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
              </Link>
            );
          })}

          {/* More button — only shown when there are extra items */}
          {moreItems.length > 0 && (
            <button
              onClick={() => setShowMore(!showMore)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-xl transition-colors min-w-[56px]",
                isMoreActive || showMore ? "text-primary" : "text-muted-foreground"
              )}
            >
              {(isMoreActive || showMore) && (
                <motion.div
                  layoutId="mobile-nav-pill"
                  className="absolute inset-0 bg-primary/8 rounded-xl"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <MoreHorizontal className="relative h-5 w-5" />
              <span className="relative text-[10px] font-medium">More</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
