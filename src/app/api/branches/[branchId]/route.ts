import type { NextRequest } from "next/server";
import { apiError, apiOk, apiValidationError } from "@/lib/api/responses";
import { updateBranch } from "@/lib/supabase/management";
import { branchUpdateSchema, dbUuidSchema } from "@/lib/validation/schemas";

interface Params {
  params: Promise<{ branchId: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { branchId } = await params;
  const id = dbUuidSchema.safeParse(branchId);
  if (!id.success) return apiValidationError(id.error);

  const payload = await request.json().catch(() => null);
  const parsed = branchUpdateSchema.safeParse(payload);
  if (!parsed.success) return apiValidationError(parsed.error);

  const result = await updateBranch(id.data, parsed.data);
  if (!result.ok) return apiError(result.code, result.message, result.status);

  return apiOk({ branch: result.data.branch });
}
