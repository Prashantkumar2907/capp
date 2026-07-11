import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/api/auth";
import { plans, type PlanId } from "@/lib/plans";

/**
 * POST /api/billing/subscribe { plan: "growth" | "pro" | "starter" }
 *
 * Creates a Razorpay Subscription and returns what the client needs to open
 * Razorpay Checkout. Requires env:
 *   RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET
 *   RAZORPAY_PLAN_STARTER / RAZORPAY_PLAN_GROWTH / RAZORPAY_PLAN_PRO
 *     (plan ids created once in the Razorpay dashboard)
 * Without them this returns 503 with a human message — billing is simply
 * "contact us" until the account exists.
 */
export async function POST(request: NextRequest) {
  const guard = await requireStaff(["owner", "admin"]);
  if (!guard.ok) return guard.response;

  const body = (await request.json()) as { plan: PlanId };
  if (!body.plan || !(body.plan in plans)) {
    return NextResponse.json({ error: "Pick a plan" }, { status: 400 });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const planEnv: Record<PlanId, string | undefined> = {
    starter: process.env.RAZORPAY_PLAN_STARTER,
    growth: process.env.RAZORPAY_PLAN_GROWTH,
    pro: process.env.RAZORPAY_PLAN_PRO,
  };
  const razorpayPlanId = planEnv[body.plan];

  if (!keyId || !keySecret || !razorpayPlanId) {
    return NextResponse.json(
      { error: "Online billing is not configured yet — contact support to upgrade." },
      { status: 503 }
    );
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/subscriptions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      plan_id: razorpayPlanId,
      total_count: 60, // monthly for up to 5 years; cancellable anytime
      quantity: 1,
      notes: { capp_org_id: guard.staff.orgId, capp_plan: body.plan },
    }),
  });

  if (!response.ok) {
    console.error("[billing] razorpay subscription create failed", response.status, await response.text());
    return NextResponse.json({ error: "Unable to start subscription — try again" }, { status: 502 });
  }

  const subscription = (await response.json()) as { id: string; short_url?: string };

  // remember which razorpay subscription this org is upgrading through, so
  // the webhook can activate it even if notes get dropped
  const admin = createAdminSupabase();
  await admin
    .from("subscriptions")
    .update({ razorpay_subscription_id: subscription.id, plan: body.plan })
    .eq("org_id", guard.staff.orgId);

  return NextResponse.json({
    ok: true,
    razorpaySubscriptionId: subscription.id,
    razorpayKeyId: keyId,
    shortUrl: subscription.short_url ?? null,
  });
}
