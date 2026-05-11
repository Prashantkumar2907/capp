import type { NextRequest } from "next/server";
import { apiError, apiOk, apiValidationError } from "@/lib/api/responses";
import { createCategory } from "@/lib/supabase/menu-management";
import { categorySchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  const parsed = categorySchema.safeParse(payload);
  if (!parsed.success) return apiValidationError(parsed.error);

  const result = await createCategory(parsed.data);
  if (!result.ok) return apiError(result.code, result.message, result.status);

  return apiOk({ category: result.data.category });
}
