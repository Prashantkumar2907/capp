import type { NextRequest } from "next/server";
import { apiError, apiOk, apiValidationError } from "@/lib/api/responses";
import { disableStaff, updateStaff } from "@/lib/supabase/management";
import { dbUuidSchema, staffUpdateSchema } from "@/lib/validation/schemas";

interface Params {
  params: Promise<{ staffId: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { staffId } = await params;
  const id = dbUuidSchema.safeParse(staffId);
  if (!id.success) return apiValidationError(id.error);

  const payload = await request.json().catch(() => null);
  const parsed = staffUpdateSchema.safeParse(payload);
  if (!parsed.success) return apiValidationError(parsed.error);

  const result = await updateStaff(id.data, parsed.data);
  if (!result.ok) return apiError(result.code, result.message, result.status);

  return apiOk({ staff: result.data.staff });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { staffId } = await params;
  const id = dbUuidSchema.safeParse(staffId);
  if (!id.success) return apiValidationError(id.error);

  const result = await disableStaff(id.data);
  if (!result.ok) return apiError(result.code, result.message, result.status);

  return apiOk({ staff: result.data.staff });
}
