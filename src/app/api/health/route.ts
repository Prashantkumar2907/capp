import type { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api/responses";
import { safeServerLog } from "@/lib/logging";
import { createAdminSupabase } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const started = Date.now();
  const checkDatabase = request?.nextUrl?.searchParams.get("ready") === "1";

  if (!checkDatabase) {
    return apiOk({ latencyMs: Date.now() - started, database: "not_checked" });
  }

  const supabase = createAdminSupabase();
  const { error } = await supabase.from("organizations").select("id").limit(1).maybeSingle();

  if (error) {
    safeServerLog("health_check_failed", { code: error.code ?? "unknown" });
    return apiError("HEALTH_CHECK_FAILED", "Health check failed", 500);
  }

  return apiOk({ latencyMs: Date.now() - started });
}
