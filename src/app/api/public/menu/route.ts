import type { NextRequest } from "next/server";
import { apiError, apiOk, apiValidationError } from "@/lib/api/responses";
import { getPublicMenu } from "@/lib/supabase/public";
import { publicMenuQuerySchema, type PublicMenuQueryInput } from "@/lib/validation/schemas";
import type { PublicMenuPayload } from "@/lib/supabase/public";

const FRESH_MS = 30_000;
const STALE_MS = 300_000;

type PublicMenuResult =
  | { ok: true; data: PublicMenuPayload }
  | { ok: false; status: number; code: string; message: string };

type CacheEntry = {
  freshUntil: number;
  staleUntil: number;
  result?: PublicMenuResult;
  pending?: Promise<PublicMenuResult>;
};

const publicMenuCache = new Map<string, CacheEntry>();

export async function GET(request: NextRequest) {
  const parsed = publicMenuQuerySchema.safeParse({
    branchId: request.nextUrl.searchParams.get("branchId"),
    tableNumber: request.nextUrl.searchParams.get("tableNumber") ?? undefined,
  });

  if (!parsed.success) return apiValidationError(parsed.error);

  const result = await getCachedPublicMenu(parsed.data);
  if (!result.ok) return apiError(result.code, result.message, result.status);

  return apiOk(result.data, {
    headers: {
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300",
    },
  });
}

function getCachedPublicMenu(input: PublicMenuQueryInput) {
  const key = `${input.branchId}:${input.tableNumber ?? ""}`;
  const now = Date.now();
  const cached = publicMenuCache.get(key);

  if (cached?.result?.ok && cached.freshUntil > now) {
    return Promise.resolve(cached.result);
  }

  if (cached?.result?.ok && cached.staleUntil > now) {
    if (!cached.pending) void refreshPublicMenu(input, key, cached);
    return Promise.resolve(cached.result);
  }

  if (cached?.pending) return cached.pending;

  return refreshPublicMenu(input, key, cached);
}

function refreshPublicMenu(input: PublicMenuQueryInput, key: string, cached?: CacheEntry) {
  const pending = getPublicMenu(input)
    .then((result) => {
      if (result.ok) {
        const now = Date.now();
        publicMenuCache.set(key, {
          freshUntil: now + FRESH_MS,
          staleUntil: now + STALE_MS,
          result,
        });
      } else {
        publicMenuCache.delete(key);
      }
      return result;
    })
    .catch((error) => {
      if (!cached?.result) publicMenuCache.delete(key);
      throw error;
    });

  publicMenuCache.set(key, {
    freshUntil: cached?.freshUntil ?? 0,
    staleUntil: cached?.staleUntil ?? 0,
    result: cached?.result,
    pending,
  });

  return pending;
}
