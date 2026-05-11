import type { NextRequest } from "next/server";
import { apiError, apiOk, apiValidationError } from "@/lib/api/responses";
import { getPublicReceipt } from "@/lib/supabase/public";
import { publicReceiptQuerySchema } from "@/lib/validation/schemas";
import type { PublicReceiptOrder, PublicResult } from "@/lib/supabase/public";

const FRESH_MS = 5_000;
const STALE_MS = 15_000;

type PublicReceiptResult = PublicResult<{ order: PublicReceiptOrder }>;
type CacheEntry<T> = {
  freshUntil: number;
  staleUntil: number;
  result?: T;
  pending?: Promise<T>;
};

const publicReceiptCache = new Map<string, CacheEntry<PublicReceiptResult>>();

export async function GET(request: NextRequest) {
  const parsed = publicReceiptQuerySchema.safeParse({
    orderId: request.nextUrl.searchParams.get("orderId"),
  });

  if (!parsed.success) return apiValidationError(parsed.error);

  const result = await getCachedPublicReceipt(parsed.data.orderId);
  if (!result.ok) return apiError(result.code, result.message, result.status);

  return apiOk(
    { order: result.data.order },
    {
      headers: {
        "Cache-Control": "private, max-age=5, stale-while-revalidate=15",
      },
    }
  );
}

function getCachedPublicReceipt(orderId: string) {
  return getCached(publicReceiptCache, orderId, () => getPublicReceipt(orderId));
}

function getCached<T extends { ok: boolean }>(cache: Map<string, CacheEntry<T>>, key: string, load: () => Promise<T>) {
  const now = Date.now();
  const cached = cache.get(key);

  if (cached?.result?.ok && cached.freshUntil > now) {
    return Promise.resolve(cached.result);
  }

  if (cached?.result?.ok && cached.staleUntil > now) {
    if (!cached.pending) void refreshCached(cache, key, load, cached);
    return Promise.resolve(cached.result);
  }

  if (cached?.pending) return cached.pending;

  return refreshCached(cache, key, load, cached);
}

function refreshCached<T extends { ok: boolean }>(cache: Map<string, CacheEntry<T>>, key: string, load: () => Promise<T>, cached?: CacheEntry<T>) {
  const pending = load()
    .then((result) => {
      if (result.ok) {
        const now = Date.now();
        cache.set(key, {
          freshUntil: now + FRESH_MS,
          staleUntil: now + STALE_MS,
          result,
        });
      } else {
        cache.delete(key);
      }
      return result;
    })
    .catch((error) => {
      if (!cached?.result) cache.delete(key);
      throw error;
    });

  cache.set(key, {
    freshUntil: cached?.freshUntil ?? 0,
    staleUntil: cached?.staleUntil ?? 0,
    result: cached?.result,
    pending,
  });

  return pending;
}
