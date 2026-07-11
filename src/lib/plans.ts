/**
 * Subscription plans — single source of truth for pricing and gates.
 *
 * Pricing strategy (see docs/roadmap.md): undercut incumbents on simplicity.
 * Trial = full Pro access for 14 days, then the org keeps working on its
 * chosen plan's limits. We never brick a running restaurant: expiry blocks
 * GROWTH actions (new branches, new staff logins), never live service
 * (orders/kitchen/settle keep working).
 */

export type PlanId = "starter" | "growth" | "pro";
export type SubscriptionEffective = "trial" | "active" | "grace" | "expired";

export interface PlanDef {
  id: PlanId;
  name: string;
  priceInr: number; // per month
  tagline: string;
  maxBranches: number; // Infinity for unlimited
  maxStaff: number;
  features: string[];
}

export const plans: Record<PlanId, PlanDef> = {
  starter: {
    id: "starter",
    name: "Starter",
    priceInr: 499,
    tagline: "One outlet, everything you need to ditch the paper register.",
    maxBranches: 1,
    maxStaff: 5,
    features: [
      "QR ordering + kitchen display",
      "Waiter POS with open orders",
      "GST bills + UPI/cash/split settle",
      "KOT thermal printing",
      "Z-report",
    ],
  },
  growth: {
    id: "growth",
    name: "Growth",
    priceInr: 1499,
    tagline: "Up to 3 branches with analytics and WhatsApp updates.",
    maxBranches: 3,
    maxStaff: 25,
    features: [
      "Everything in Starter",
      "Up to 3 branches",
      "Branch comparison analytics",
      "Kitchen station routing",
      "WhatsApp order-ready alerts",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceInr: 3999,
    tagline: "Unlimited branches for chains and franchises.",
    maxBranches: Number.POSITIVE_INFINITY,
    maxStaff: Number.POSITIVE_INFINITY,
    features: ["Everything in Growth", "Unlimited branches & staff", "Priority support"],
  },
};

export const TRIAL_DAYS = 14;
/** After trial/period end we allow this many days of grace before gating. */
export const GRACE_DAYS = 5;

export interface SubscriptionRowLike {
  plan: string;
  status: string;
  trial_ends_at?: string | null;
  current_period_end?: string | null;
}

/** Resolve the effective state a UI or gate should act on. */
export function effectiveState(subscription: SubscriptionRowLike | null | undefined, now = new Date()): {
  effective: SubscriptionEffective;
  plan: PlanId;
  daysLeft: number | null;
} {
  if (!subscription) return { effective: "expired", plan: "starter", daysLeft: 0 };
  const plan = (["starter", "growth", "pro"].includes(subscription.plan) ? subscription.plan : "starter") as PlanId;

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysUntil = (value: string | null | undefined) =>
    value ? Math.ceil((new Date(value).getTime() - now.getTime()) / msPerDay) : null;

  if (subscription.status === "active") {
    const left = daysUntil(subscription.current_period_end);
    if (left === null || left > 0) return { effective: "active", plan, daysLeft: left };
    if (left > -GRACE_DAYS) return { effective: "grace", plan, daysLeft: left + GRACE_DAYS };
    return { effective: "expired", plan, daysLeft: 0 };
  }

  if (subscription.status === "trial") {
    const left = daysUntil(subscription.trial_ends_at);
    // legacy rows without trial_ends_at: treat as in-trial (backfilled by migration)
    if (left === null || left > 0) return { effective: "trial", plan: "pro", daysLeft: left };
    if (left > -GRACE_DAYS) return { effective: "grace", plan, daysLeft: left + GRACE_DAYS };
    return { effective: "expired", plan, daysLeft: 0 };
  }

  if (subscription.status === "past_due") {
    const left = daysUntil(subscription.current_period_end);
    if (left !== null && left > -GRACE_DAYS) return { effective: "grace", plan, daysLeft: left + GRACE_DAYS };
    return { effective: "expired", plan, daysLeft: 0 };
  }

  return { effective: "expired", plan, daysLeft: 0 };
}

/** Growth-action gate: creating branches/staff is blocked when expired; live service never is. */
export function canGrow(effective: SubscriptionEffective) {
  return effective !== "expired";
}
