import type { NextRequest } from "next/server";
import { apiError, apiOk, apiValidationError } from "@/lib/api/responses";
import { createTable } from "@/lib/supabase/table-management";
import { tableCreateSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError("INVALID_JSON", "Request body must be valid JSON", 400);
  }

  const parsed = tableCreateSchema.safeParse(payload);
  if (!parsed.success) return apiValidationError(parsed.error);

  const result = await createTable(parsed.data);
  if (!result.ok) return apiError(result.code, result.message, result.status);

  return apiOk({ table: result.data.table });
}
