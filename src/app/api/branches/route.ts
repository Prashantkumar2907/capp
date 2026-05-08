import type { NextRequest } from "next/server";
import { apiError, apiOk, apiValidationError } from "@/lib/api/responses";
import { createBranch } from "@/lib/supabase/management";
import { branchSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  const parsed = branchSchema.safeParse(payload);
  if (!parsed.success) return apiValidationError(parsed.error);

  const result = await createBranch(parsed.data);
  if (!result.ok) return apiError(result.code, result.message, result.status);

  return apiOk({ branch: result.data.branch });
}
