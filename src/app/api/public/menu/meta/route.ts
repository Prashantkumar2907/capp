import type { NextRequest } from "next/server";
import { apiError, apiOk, apiValidationError } from "@/lib/api/responses";
import { getPublicMenuMeta } from "@/lib/supabase/public";
import { publicMenuQuerySchema } from "@/lib/validation/schemas";
import type { PublicMenuMetaPayload, PublicResult } from "@/lib/supabase/public";

const FRESH_MS = 30_000;
const STALE_MS = 300_000;

type PublicMenuMetaResult = PublicResult<PublicMenuMetaPayload>;
type CacheEntry<T> = {
  freshUntil: number;
  staleUntil: number;
  result?: T;
  pending?: Promise<T>;
};

const publicMenuMetaCache = new Map<string, CacheEntry<PublicMenuMetaResult>>();

export async function GET(request: NextRequest) {
  const parsed = publicMenuQuerySchema.safeParse({
    branchId: request.nextUrl.searchParams.get("branchId"),
    tableNumber: request.nextUrl.searchParams.get("tableNumber") ?? undefined,
  });

  if (!parsed.success) return apiValidationError(parsed.error);

  const result = await getCachedPublicMenuMeta(parsed.data);
  if (!result.ok) return apiError(result.code, result.message, result.status);

  return apiOk(result.data, {
    headers: {
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300",
    },
  });
}

function getCachedPublicMenuMeta(input: { branchId: string; tableNumber?: number }) {
  return getCached(publicMenuMetaCache, `${input.branchId}:${input.tableNumber ?? "none"}`, () => getPublicMenuMeta(input));
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
