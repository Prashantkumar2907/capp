import type { NextRequest } from "next/server";
import { apiError, apiOk, apiValidationError } from "@/lib/api/responses";
import { updateCategory } from "@/lib/supabase/menu-management";
import { categoryUpdateSchema, dbUuidSchema } from "@/lib/validation/schemas";

interface Params {
  params: Promise<{ categoryId: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { categoryId } = await params;
  const id = dbUuidSchema.safeParse(categoryId);
  if (!id.success) return apiValidationError(id.error);

  const payload = await request.json().catch(() => null);
  const parsed = categoryUpdateSchema.safeParse(payload);
  if (!parsed.success) return apiValidationError(parsed.error);

  const result = await updateCategory(id.data, parsed.data);
  if (!result.ok) return apiError(result.code, result.message, result.status);

  return apiOk({ category: result.data.category });
}
