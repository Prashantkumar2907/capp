"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ChefHat, CircleDot, Soup, Sparkles, UtensilsCrossed } from "lucide-react";
import type { OrderStatus } from "@/lib/constants";

const steps: Array<{ key: OrderStatus; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: "pending", label: "Placed", icon: CircleDot },
  { key: "confirmed", label: "Accepted", icon: CheckCircle2 },
  { key: "preparing", label: "Cooking", icon: Soup },
  { key: "ready", label: "Ready", icon: Sparkles },
  { key: "served", label: "Served", icon: UtensilsCrossed },
];

/**
 * The customer's "where is my food" view. A glance answers it: filled dots
 * for done, a gently pulsing dot for now, grey for later. Animates on every
 * status change (the receipt polls while the order is active).
 */
export function OrderProgress({ status }: { status: OrderStatus }) {
  if (status === "cancelled") {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-center text-sm text-destructive">
        This order was cancelled.
      </div>
    );
  }

  const activeIndex = Math.max(0, steps.findIndex((step) => step.key === status));
  const progress = activeIndex / (steps.length - 1);

  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="relative">
        {/* track */}
        <div className="absolute left-4 right-4 top-4 h-0.5 -translate-y-1/2 bg-border" aria-hidden />
        <motion.div
          className="absolute left-4 top-4 h-0.5 -translate-y-1/2 bg-primary"
          initial={false}
          animate={{ width: `calc(${progress} * (100% - 2rem))` }}
          transition={{ type: "spring", stiffness: 90, damping: 20 }}
          aria-hidden
        />
        <ol className="relative flex justify-between">
          {steps.map((step, index) => {
            const done = index < activeIndex;
            const current = index === activeIndex;
            const Icon = step.icon;
            return (
              <li key={step.key} className="flex w-8 flex-col items-center gap-1.5">
                <motion.div
                  initial={false}
                  animate={{
                    scale: current ? 1.15 : 1,
                    backgroundColor: done || current ? "var(--primary)" : "var(--card)",
                  }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  className={`relative flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    done || current ? "border-primary text-primary-foreground" : "border-border text-muted-foreground"
                  }`}
                >
                  {current && status !== "served" ? (
                    <motion.span
                      className="absolute inset-0 rounded-full border-2 border-primary"
                      animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                      aria-hidden
                    />
                  ) : null}
                  <Icon className="h-4 w-4" />
                </motion.div>
                <span className={`text-center text-[0.6rem] leading-tight ${current ? "font-semibold" : "text-muted-foreground"}`}>
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      {status !== "served" ? (
        <motion.p
          key={status}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground"
        >
          <ChefHat className="h-3.5 w-3.5" />
          {status === "pending" && "Your order has reached the restaurant"}
          {status === "confirmed" && "The kitchen has accepted your order"}
          {status === "preparing" && "Your food is being cooked fresh"}
          {status === "ready" && "Your order is ready — it's on its way!"}
        </motion.p>
      ) : null}
    </div>
  );
}
