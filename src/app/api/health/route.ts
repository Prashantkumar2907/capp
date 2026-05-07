import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

export async function GET() {
  const started = Date.now();
  const supabase = createAdminSupabase();
  const { error } = await supabase.from("organizations").select("id", { count: "exact", head: true });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, latencyMs: Date.now() - started });
}
