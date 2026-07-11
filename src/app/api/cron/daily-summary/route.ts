import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { sendWhatsApp, dailySummaryMessage } from "@/lib/notify-whatsapp";

/**
 * POST|GET /api/cron/daily-summary
 *
 * Sends each active org's owner a WhatsApp recap of yesterday — sales, order
 * count, top dish, rating. The message that keeps owners feeling the value
 * without opening the app. Run once each morning (Supabase/Vercel cron).
 * CRON_SECRET-gated. No-op per owner if WhatsApp isn't configured or the
 * owner has no phone.
 */
async function handle(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const header = request.headers.get("authorization");
    const provided = header?.replace(/^Bearer\s+/i, "") ?? request.nextUrl.searchParams.get("secret");
    if (provided !== secret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminSupabase();

  // yesterday's window in IST (owners think in local days)
  const now = new Date();
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffsetMs);
  const istMidnight = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate()));
  const startUtc = new Date(istMidnight.getTime() - 24 * 60 * 60 * 1000 - istOffsetMs);
  const endUtc = new Date(istMidnight.getTime() - istOffsetMs);
  const dateLabel = new Date(startUtc.getTime() + istOffsetMs).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  const { data: orgs } = await admin.from("organizations").select("id, name");
  if (!orgs?.length) return NextResponse.json({ ok: true, sent: 0 });

  let sent = 0;
  for (const org of orgs) {
    // owner with a phone
    const { data: owner } = await admin
      .from("staff")
      .select("phone")
      .eq("org_id", org.id)
      .eq("role", "owner")
      .not("phone", "is", null)
      .limit(1)
      .maybeSingle();
    if (!owner?.phone) continue;

    const { data: orders } = await admin
      .from("orders")
      .select("total, status, branch_id, branches!inner(org_id)")
      .eq("branches.org_id", org.id)
      .gte("created_at", startUtc.toISOString())
      .lt("created_at", endUtc.toISOString());

    const valid = (orders ?? []).filter((order) => order.status !== "cancelled");
    if (!valid.length) continue; // don't nag on a zero day

    const revenue = valid.reduce((sum, order) => sum + Number(order.total), 0);

    // top dish yesterday
    const { data: items } = await admin
      .from("order_items")
      .select("dish_name, quantity, branch_id, branches!inner(org_id)")
      .eq("branches.org_id", org.id)
      .neq("status", "cancelled")
      .gte("created_at", startUtc.toISOString())
      .lt("created_at", endUtc.toISOString());
    const dishTotals = new Map<string, number>();
    (items ?? []).forEach((item) => dishTotals.set(item.dish_name, (dishTotals.get(item.dish_name) ?? 0) + Number(item.quantity)));
    const topDish = [...dishTotals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    const { data: feedback } = await admin
      .from("feedback")
      .select("rating, branch_id, branches!inner(org_id)")
      .eq("branches.org_id", org.id)
      .gte("created_at", startUtc.toISOString())
      .lt("created_at", endUtc.toISOString());
    const avgRating = feedback?.length ? feedback.reduce((sum, row) => sum + row.rating, 0) / feedback.length : null;

    const result = await sendWhatsApp(
      owner.phone,
      dailySummaryMessage({ restaurantName: org.name, date: dateLabel, revenue, orders: valid.length, topDish, avgRating })
    );
    if (result.ok && !result.skipped) sent += 1;
  }

  return NextResponse.json({ ok: true, sent, date: dateLabel });
}

export async function POST(request: NextRequest) {
  return handle(request);
}
export async function GET(request: NextRequest) {
  return handle(request);
}
