import type { NextRequest } from "next/server";
import { apiError, apiOk, apiValidationError } from "@/lib/api/responses";
import { deleteDish, updateDish } from "@/lib/supabase/menu-management";
import { dbUuidSchema, dishUpdateSchema } from "@/lib/validation/schemas";

interface Params {
  params: Promise<{ dishId: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { dishId } = await params;
  const id = dbUuidSchema.safeParse(dishId);
  if (!id.success) return apiValidationError(id.error);

  const payload = await request.json().catch(() => null);
  const parsed = dishUpdateSchema.safeParse(payload);
  if (!parsed.success) return apiValidationError(parsed.error);

  const result = await updateDish(id.data, parsed.data);
  if (!result.ok) return apiError(result.code, result.message, result.status);

  return apiOk({ dish: result.data.dish });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { dishId } = await params;
  const id = dbUuidSchema.safeParse(dishId);
  if (!id.success) return apiValidationError(id.error);

  const result = await deleteDish(id.data);
  if (!result.ok) return apiError(result.code, result.message, result.status);

  return apiOk({ dish: result.data.dish });
}
