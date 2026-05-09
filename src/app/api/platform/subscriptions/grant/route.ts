import type { NextRequest } from "next/server";
import { apiError, apiOk, apiValidationError } from "@/lib/api/responses";
import { grantPlatformSubscription } from "@/lib/supabase/platform-admin";
import { platformSubscriptionGrantSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError("INVALID_JSON", "Request body must be valid JSON", 400);
  }

  const parsed = platformSubscriptionGrantSchema.safeParse(payload);
  if (!parsed.success) return apiValidationError(parsed.error);

  const result = await grantPlatformSubscription(parsed.data);
  if (!result.ok) return apiError(result.code, result.message, result.status);

  return apiOk({ subscription: result.data.subscription });
}
