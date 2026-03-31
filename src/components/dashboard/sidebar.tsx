"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/helpers";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Store,
  Users,
  ChefHat,
  QrCode,
  BarChart3,
  Settings,
  LogOut,
  CreditCard,
  ClipboardList,
  MonitorSmartphone,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["owner", "admin", "manager"] },
  { label: "Orders", href: "/dashboard/orders", icon: ClipboardList, roles: ["owner", "admin", "manager"] },
  { label: "Menu", href: "/dashboard/menu", icon: UtensilsCrossed, roles: ["owner", "admin", "manager"] },
  { label: "Tables", href: "/dashboard/tables", icon: QrCode, roles: ["owner", "admin", "manager"] },
  { label: "Branches", href: "/dashboard/branches", icon: Store, roles: ["owner"] },
  { label: "Staff", href: "/dashboard/staff", icon: Users, roles: ["owner", "admin"] },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3, roles: ["owner", "admin"] },
  { label: "Payments", href: "/dashboard/payments", icon: CreditCard, roles: ["owner", "admin", "cashier"] },
  { label: "Kitchen", href: "/dashboard/kitchen", icon: ChefHat, roles: ["kitchen", "owner", "admin"] },
  { label: "Waiter", href: "/dashboard/waiter", icon: MonitorSmartphone, roles: ["waiter", "owner", "admin"] },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, roles: ["owner", "admin"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { staff, organization, signOut, role } = useAuth();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  const handleSignOut = () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      signOut();
    }
  };

  const filteredItems = navItems.filter((item) => role && item.roles.includes(role));

  return (
    <TooltipProvider delay={0}>
      <aside
        className={cn(
          "h-screen flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0 transition-all duration-200 ease-out",
          sidebarCollapsed ? "w-[52px]" : "w-52"
        )}
      >
        {/* Logo */}
        <div className="h-12 flex items-center gap-2 px-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="h-7 w-7 rounded-lg bg-teal-500 flex items-center justify-center shrink-0 hover:bg-teal-600 transition-colors cursor-pointer" onClick={toggleSidebar}>
            <UtensilsCrossed className="h-3.5 w-3.5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <span className="text-sm font-bold font-poppins truncate">
              {organization?.name || "RestaurantOS"}
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto scrollbar-hide py-1.5 px-1.5">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const linkContent = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 mb-0.5",
                  isActive
                    ? "bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400"
                    : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 hover:text-zinc-800 dark:hover:text-zinc-200",
                  sidebarCollapsed && "justify-center px-0"
                )}
              >
                <item.icon className={cn(
                  "h-4 w-4 shrink-0 transition-transform duration-150",
                  !isActive && "group-hover:scale-110"
                )} />
                {!sidebarCollapsed && item.label}
              </Link>
            );

            if (sidebarCollapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">{item.label}</TooltipContent>
                </Tooltip>
              );
            }
            return linkContent;
          })}
        </nav>

        <Separator />

        {/* Collapse toggle */}
        <div className={cn("px-1.5 py-1", sidebarCollapsed && "flex justify-center")}>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-zinc-400 hover:text-zinc-600 h-7"
            onClick={toggleSidebar}
          >
            {sidebarCollapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
          </Button>
        </div>

        {/* User */}
        <div className={cn("p-2 border-t border-zinc-200 dark:border-zinc-800", sidebarCollapsed && "flex flex-col items-center")}>
          {sidebarCollapsed ? (
            <Tooltip>
              <TooltipTrigger>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleSignOut}>
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[9px] bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300">
                      {staff ? getInitials(staff.full_name) : "?"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">{staff?.full_name} · Sign Out</TooltipContent>
            </Tooltip>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1.5">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-[9px] bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300">
                    {staff ? getInitials(staff.full_name) : "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium truncate">{staff?.full_name}</p>
                  <p className="text-[9px] text-zinc-400">{role}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-[11px] h-7 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                onClick={handleSignOut}
              >
                <LogOut className="h-3 w-3 mr-1.5" />
                Sign Out
              </Button>
            </>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
