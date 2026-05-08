import type { NextRequest } from "next/server";
import { apiError, apiOk, apiValidationError } from "@/lib/api/responses";
import { getPublicMenu } from "@/lib/supabase/public";
import { publicMenuQuerySchema } from "@/lib/validation/schemas";

export async function GET(request: NextRequest) {
  const parsed = publicMenuQuerySchema.safeParse({
    branchId: request.nextUrl.searchParams.get("branchId"),
    tableNumber: request.nextUrl.searchParams.get("tableNumber") ?? undefined,
  });

  if (!parsed.success) return apiValidationError(parsed.error);

  const result = await getPublicMenu(parsed.data);
  if (!result.ok) return apiError(result.code, result.message, result.status);

  return apiOk(result.data);
}
