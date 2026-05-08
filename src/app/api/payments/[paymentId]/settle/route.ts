import type { NextRequest } from "next/server";
import { apiError, apiOk, apiValidationError } from "@/lib/api/responses";
import { settlePayment } from "@/lib/supabase/payments";
import { dbUuidSchema, paymentSettlementSchema } from "@/lib/validation/schemas";

interface Params {
  params: Promise<{ paymentId: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { paymentId } = await params;
  const id = dbUuidSchema.safeParse(paymentId);
  if (!id.success) return apiValidationError(id.error);

  const payload = await request.json().catch(() => null);
  const parsed = paymentSettlementSchema.safeParse(payload);
  if (!parsed.success) return apiValidationError(parsed.error);

  const result = await settlePayment(id.data, parsed.data);
  if (!result.ok) return apiError(result.code, result.message, result.status);

  return apiOk({ payment: result.payment ?? null });
}
