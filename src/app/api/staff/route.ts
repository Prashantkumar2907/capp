import type { NextRequest } from "next/server";
import { apiError, apiOk, apiValidationError } from "@/lib/api/responses";
import { createStaff } from "@/lib/supabase/management";
import { staffSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  const parsed = staffSchema.safeParse(payload);
  if (!parsed.success) return apiValidationError(parsed.error);

  const result = await createStaff(parsed.data);
  if (!result.ok) return apiError(result.code, result.message, result.status);

  return apiOk({ staff: result.data.staff });
}
