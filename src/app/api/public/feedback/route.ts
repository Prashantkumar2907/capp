import type { NextRequest } from "next/server";
import { apiError, apiOk, apiValidationError } from "@/lib/api/responses";
import { createPublicFeedback } from "@/lib/supabase/public";
import { publicFeedbackSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  const parsed = publicFeedbackSchema.safeParse(payload);
  if (!parsed.success) return apiValidationError(parsed.error);

  const result = await createPublicFeedback(parsed.data);
  if (!result.ok) return apiError(result.code, result.message, result.status);

  return apiOk({ feedbackId: result.data.feedbackId });
}
