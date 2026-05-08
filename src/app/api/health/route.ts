import { apiError, apiOk } from "@/lib/api/responses";
import { safeServerLog } from "@/lib/logging";
import { createAdminSupabase } from "@/lib/supabase/admin";

export async function GET() {
  const started = Date.now();
  const supabase = createAdminSupabase();
  const { error } = await supabase.from("organizations").select("id", { count: "exact", head: true });

  if (error) {
    safeServerLog("health_check_failed", { code: error.code ?? "unknown" });
    return apiError("HEALTH_CHECK_FAILED", "Health check failed", 500);
  }

  return apiOk({ latencyMs: Date.now() - started });
}
