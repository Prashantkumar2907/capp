import type { NextRequest } from "next/server";
import { apiError, apiOk, apiValidationError } from "@/lib/api/responses";
import { transitionOrderStatus } from "@/lib/supabase/order-status";
import { dbUuidSchema, orderStatusUpdateSchema } from "@/lib/validation/schemas";

interface Params {
  params: Promise<{ orderId: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { orderId } = await params;
  const id = dbUuidSchema.safeParse(orderId);
  if (!id.success) return apiValidationError(id.error);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_JSON", "Request body must be valid JSON", 400);
  }

  const parsed = orderStatusUpdateSchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error);

  const result = await transitionOrderStatus(id.data, parsed.data.status);
  if (!result.ok) return apiError(result.code, result.message, result.status);

  return apiOk({ order: result.order, itemStatus: result.itemStatus, unchanged: result.unchanged });
}
