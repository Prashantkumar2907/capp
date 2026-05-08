import type { NextRequest } from "next/server";
import { apiError, apiOk, apiValidationError } from "@/lib/api/responses";
import { getPublicReceipt } from "@/lib/supabase/public";
import { publicReceiptQuerySchema } from "@/lib/validation/schemas";

export async function GET(request: NextRequest) {
  const parsed = publicReceiptQuerySchema.safeParse({
    orderId: request.nextUrl.searchParams.get("orderId"),
  });

  if (!parsed.success) return apiValidationError(parsed.error);

  const result = await getPublicReceipt(parsed.data.orderId);
  if (!result.ok) return apiError(result.code, result.message, result.status);

  return apiOk({ order: result.data.order });
}
