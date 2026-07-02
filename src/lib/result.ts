export interface AppError {
  code: string;
  message: string;
  detail?: string;
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: AppError };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function fail(error: unknown, code = "APP_ERROR"): Result<never> {
  if (error instanceof Error) {
    return { ok: false, error: { code, message: error.message } };
  }

  if (typeof error === "object" && error && "message" in error) {
    return { ok: false, error: { code, message: String((error as { message: unknown }).message) } };
  }

  return { ok: false, error: { code, message: "Something went wrong" } };
}
