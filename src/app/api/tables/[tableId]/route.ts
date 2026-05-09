import type { NextRequest } from "next/server";
import { apiError, apiOk, apiValidationError } from "@/lib/api/responses";
import { updateTableStatus } from "@/lib/supabase/table-management";
import { dbUuidSchema, tableStatusUpdateSchema } from "@/lib/validation/schemas";

interface Params {
  params: Promise<{ tableId: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { tableId } = await params;
  const id = dbUuidSchema.safeParse(tableId);
  if (!id.success) return apiValidationError(id.error);

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError("INVALID_JSON", "Request body must be valid JSON", 400);
  }

  const parsed = tableStatusUpdateSchema.safeParse(payload);
  if (!parsed.success) return apiValidationError(parsed.error);

  const result = await updateTableStatus(id.data, parsed.data);
  if (!result.ok) return apiError(result.code, result.message, result.status);

  return apiOk({ table: result.data.table });
}
