import { apiError, apiOk } from "@/lib/api/responses";
import { getPlatformOverview } from "@/lib/supabase/platform-admin";

export async function GET() {
  const result = await getPlatformOverview();
  if (!result.ok) return apiError(result.code, result.message, result.status);

  return apiOk(result.data);
}
