import type { NextRequest } from "next/server";
import { apiError, apiOk, apiValidationError } from "@/lib/api/responses";
import { createDish } from "@/lib/supabase/menu-management";
import { dishSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  const parsed = dishSchema.safeParse(payload);
  if (!parsed.success) return apiValidationError(parsed.error);

  const result = await createDish(parsed.data);
  if (!result.ok) return apiError(result.code, result.message, result.status);

  return apiOk({ dish: result.data.dish });
}
