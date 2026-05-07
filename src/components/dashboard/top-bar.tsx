"use client";

import { useAuth } from "@/hooks/use-auth";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Bell } from "lucide-react";
import { motion } from "framer-motion";

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/orders": "Orders",
  "/dashboard/kitchen": "Kitchen",
  "/dashboard/waiter": "Waiter",
  "/dashboard/menu": "Menu",
  "/dashboard/tables": "Tables",
  "/dashboard/branches": "Branches",
  "/dashboard/staff": "Staff",
  "/dashboard/analytics": "Analytics",
  "/dashboard/payments": "Payments",
  "/dashboard/settings": "Settings",
};

const ROUTE_ICONS: Record<string, string> = {
  "/dashboard": "🏠",
  "/dashboard/orders": "🛒",
  "/dashboard/kitchen": "👨‍🍳",
  "/dashboard/waiter": "📋",
  "/dashboard/menu": "🍽️",
  "/dashboard/tables": "📍",
  "/dashboard/branches": "🏪",
  "/dashboard/staff": "👥",
  "/dashboard/analytics": "📊",
  "/dashboard/payments": "💳",
  "/dashboard/settings": "⚙️",
};

export function TopBar() {
  const { staff, branch } = useAuth();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const pageTitle = ROUTE_LABELS[pathname] || "Dashboard";
  const pageIcon = ROUTE_ICONS[pathname] || "🏠";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const firstName = staff?.full_name?.split(" ")[0] || "there";

  return (
    <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-2.5"
        >
          <span className="text-lg hidden sm:block leading-none">{pageIcon}</span>
          <div>
            <h2 className="text-sm font-semibold leading-tight">{pageTitle}</h2>
            <p className="text-[10px] text-muted-foreground hidden sm:block leading-tight mt-0.5">
              {getGreeting()}, {firstName}{branch ? ` · ${branch.name}` : ""}
            </p>
          </div>
        </motion.div>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0 rounded-xl">
          <Bell className="h-4 w-4" />
          {/* Unread dot — static for now */}
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
        </Button>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0 rounded-xl"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
        </Button>

        {/* User avatar */}
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary ring-2 ring-primary/20 ml-1">
          {staff?.full_name?.charAt(0).toUpperCase() || "U"}
        </div>
      </div>
    </header>
  );
}
