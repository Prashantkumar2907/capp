"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check, ChefHat, QrCode, Store, UtensilsCrossed } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/features/auth/auth-provider";

interface Step {
  key: string;
  label: string;
  hint: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  done: boolean;
}

/**
 * Shown on the Counter until the restaurant has a menu and has taken its
 * first order. It turns an intimidating empty dashboard into three obvious
 * next actions — the make-or-break first-run moment for a non-technical
 * owner. Disappears on its own once setup is real.
 */
export function SetupChecklist() {
  const { organization, branch } = useAuth();
  const supabase = createClient();

  const status = useQuery({
    queryKey: ["setup-status", organization?.id, branch?.id],
    queryFn: async () => {
      const [{ count: dishCount }, { count: tableCount }, { count: orderCount }, { count: staffCount }] = await Promise.all([
        supabase.from("dishes").select("id", { count: "exact", head: true }).eq("org_id", organization!.id).eq("is_active", true),
        supabase.from("tables").select("id", { count: "exact", head: true }).eq("branch_id", branch!.id),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("branch_id", branch!.id),
        supabase.from("staff").select("id", { count: "exact", head: true }).eq("org_id", organization!.id),
      ]);
      return {
        hasMenu: (dishCount ?? 0) > 0,
        hasTables: (tableCount ?? 0) > 0,
        hasOrder: (orderCount ?? 0) > 0,
        hasStaff: (staffCount ?? 0) > 1, // owner themself counts as 1
      };
    },
    enabled: !!organization && !!branch,
  });

  if (!status.data) return null;
  // once the core loop has run, stop nagging
  if (status.data.hasMenu && status.data.hasOrder) return null;

  const steps: Step[] = [
    { key: "menu", label: "Add your dishes", hint: "Prices, half/full plates, veg marks", href: "/dashboard/menu", icon: UtensilsCrossed, done: status.data.hasMenu },
    { key: "tables", label: "Set up tables & QR codes", hint: "Print a QR code for each table", href: "/dashboard/tables", icon: QrCode, done: status.data.hasTables },
    { key: "staff", label: "Create staff logins", hint: "Kitchen, waiter, cashier — optional", href: "/dashboard/staff", icon: ChefHat, done: status.data.hasStaff },
    { key: "order", label: "Take your first order", hint: "From the waiter screen or a QR scan", href: "/dashboard/waiter", icon: Store, done: status.data.hasOrder },
  ];
  const completed = steps.filter((step) => step.done).length;

  return (
    <Card className="overflow-hidden border-primary/25">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Get your restaurant running</h2>
            <p className="text-sm text-muted-foreground">A few quick steps and you&apos;re taking orders.</p>
          </div>
          <div className="font-numbers text-sm font-medium text-muted-foreground">{completed}/{steps.length}</div>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${(completed / steps.length) * 100}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>

        <div className="grid gap-2">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <Link
                key={step.key}
                href={step.href}
                className={`group flex items-center gap-3 rounded-2xl border p-3 transition-colors ${step.done ? "border-transparent bg-secondary/50" : "bg-card hover:border-primary/40"}`}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${step.done ? "bg-success/15 text-success" : "bg-primary/10 text-primary"}`}>
                  {step.done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${step.done ? "text-muted-foreground line-through" : ""}`}>{step.label}</p>
                  {!step.done ? <p className="truncate text-xs text-muted-foreground">{step.hint}</p> : null}
                </div>
                {!step.done ? <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" /> : null}
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
