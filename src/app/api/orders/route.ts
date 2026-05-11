import type { NextRequest } from "next/server";
import { apiError, apiOk, apiValidationError } from "@/lib/api/responses";
import { createRestaurantOrder } from "@/lib/supabase/orders";
import { createOrderSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(payload);

  if (!parsed.success) {
    return apiValidationError(parsed.error);
  }

  const result = await createRestaurantOrder(parsed.data);
  if (!result.ok) {
    return apiError(result.code, result.message, result.status);
  }

  return apiOk({ order: result.order, duplicate: result.duplicate, receiptToken: result.order.receipt_token });
}
