"use client";

import { useState } from "react";
import { CheckCircle2, Crown, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/features/auth/auth-provider";
import { plans, type PlanId } from "@/lib/plans";
import { formatCurrency } from "@/lib/utils";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

/**
 * Plan cards + upgrade flow. Loads Razorpay Checkout on demand; when billing
 * env isn't configured the API answers 503 with a human "contact support"
 * message and nothing breaks.
 */
export function BillingCard() {
  const { plan, subscription, hasRole, refresh } = useAuth();
  const [busyPlan, setBusyPlan] = useState<PlanId | null>(null);

  if (!hasRole("owner", "admin")) return null;

  const stateLabel =
    plan.effective === "trial"
      ? `Free trial — ${plan.daysLeft ?? "?"} day${plan.daysLeft === 1 ? "" : "s"} left (full Pro access)`
      : plan.effective === "active"
        ? `${plans[plan.plan].name} plan active`
        : plan.effective === "grace"
          ? `Payment due — ${plan.daysLeft ?? 0} grace day${plan.daysLeft === 1 ? "" : "s"} left`
          : "Subscription expired — live service keeps working, growth actions are paused";

  const loadCheckout = () =>
    new Promise<boolean>((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const upgrade = async (target: PlanId) => {
    setBusyPlan(target);
    try {
      const response = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: target }),
      });
      const payload = (await response.json()) as {
        error?: string;
        razorpaySubscriptionId?: string;
        razorpayKeyId?: string;
        shortUrl?: string | null;
      };
      if (!response.ok) throw new Error(payload.error ?? "Unable to start subscription");

      const loaded = await loadCheckout();
      if (loaded && window.Razorpay && payload.razorpaySubscriptionId && payload.razorpayKeyId) {
        new window.Razorpay({
          key: payload.razorpayKeyId,
          subscription_id: payload.razorpaySubscriptionId,
          name: "CAPP",
          description: `${plans[target].name} plan`,
          handler: () => {
            toast.success("Payment received — your plan activates in a moment");
            void refresh();
          },
        }).open();
      } else if (payload.shortUrl) {
        window.open(payload.shortUrl, "_blank");
      } else {
        throw new Error("Checkout could not be opened");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to start subscription");
    } finally {
      setBusyPlan(null);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Crown className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Subscription</h2>
            <p className="text-xs text-muted-foreground">{stateLabel}</p>
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          {(Object.keys(plans) as PlanId[]).map((planId) => {
            const definition = plans[planId];
            const isCurrent = plan.effective !== "trial" && plan.plan === planId && (plan.effective === "active" || plan.effective === "grace");
            return (
              <div key={planId} className={`flex flex-col rounded-2xl border p-4 ${isCurrent ? "border-primary bg-primary/5" : "bg-card"}`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{definition.name}</p>
                  {isCurrent ? <Badge>Current</Badge> : null}
                </div>
                <p className="font-numbers mt-1 text-xl font-bold">
                  {formatCurrency(definition.priceInr)}
                  <span className="text-xs font-normal text-muted-foreground">/month</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{definition.tagline}</p>
                <ul className="mt-3 flex-1 space-y-1.5">
                  {definition.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-1.5 text-xs">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-4 w-full"
                  variant={isCurrent ? "secondary" : "default"}
                  size="sm"
                  disabled={isCurrent || busyPlan !== null}
                  onClick={() => void upgrade(planId)}
                >
                  {isCurrent ? "Your plan" : busyPlan === planId ? "Opening checkout…" : plan.effective === "trial" ? <><Sparkles className="h-3.5 w-3.5" />Choose {definition.name}</> : `Switch to ${definition.name}`}
                </Button>
              </div>
            );
          })}
        </div>
        {subscription?.razorpay_subscription_id ? (
          <p className="text-[0.65rem] text-muted-foreground">Billing ref: {subscription.razorpay_subscription_id}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
