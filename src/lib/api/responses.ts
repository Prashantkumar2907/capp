import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export function apiOk<T extends Record<string, unknown>>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, ...data }, init);
}

export function apiError(code: string, message: string, status = 400) {
  return NextResponse.json({ ok: false, code, error: message }, { status });
}

export function apiValidationError(error: ZodError) {
  const issue = error.issues[0];
  const field = issue?.path.length ? issue.path.join(".") : "request";
  const message = issue ? `${field}: ${issue.message}` : "Request payload is invalid";
  return apiError("VALIDATION_ERROR", message, 400);
}
