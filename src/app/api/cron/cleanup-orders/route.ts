import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

/**
 * POST /api/cron/cleanup-orders
 *
 * Auto-cancels unpaid, unserved orders older than the cutoff (QR walk-aways
 * that would otherwise hold tables and clutter the kitchen forever).
 *
 * Protected by CRON_SECRET (Bearer or ?secret=). Wire to a scheduler:
 *   - Supabase: pg_cron calling this URL, or a Scheduled Edge Function
 *   - Vercel Cron: add to vercel.json, it sends the secret automatically
 * Body/query: hours (default 4).
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const header = request.headers.get("authorization");
    const fromQuery = request.nextUrl.searchParams.get("secret");
    const provided = header?.replace(/^Bearer\s+/i, "") ?? fromQuery;
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const hoursParam = Number(request.nextUrl.searchParams.get("hours"));
  const hours = Number.isFinite(hoursParam) && hoursParam > 0 ? hoursParam : 4;

  const admin = createAdminSupabase();
  const { data, error } = await admin.rpc("cleanup_abandoned_orders", {
    p_older_than: `${hours} hours`,
  });

  if (error) {
    console.error("[cron] cleanup failed:", error.message);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, cancelled: data ?? 0, olderThanHours: hours });
}

// GET convenience for schedulers that only issue GET (same secret rule)
export async function GET(request: NextRequest) {
  return POST(request);
}
