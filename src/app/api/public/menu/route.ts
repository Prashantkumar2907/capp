import type { NextRequest } from "next/server";
import { apiError, apiOk, apiValidationError } from "@/lib/api/responses";
import { getPublicBranchMenu, getPublicTable } from "@/lib/supabase/public";
import { publicMenuQuerySchema, type PublicMenuQueryInput } from "@/lib/validation/schemas";
import type { PublicBranchMenuPayload, PublicMenuPayload, PublicMenuTable, PublicResult } from "@/lib/supabase/public";

const FRESH_MS = 30_000;
const STALE_MS = 300_000;

type PublicMenuResult =
  | { ok: true; data: PublicMenuPayload }
  | { ok: false; status: number; code: string; message: string };

type CacheEntry<T> = {
  freshUntil: number;
  staleUntil: number;
  result?: T;
  pending?: Promise<T>;
};

type PublicBranchMenuResult = PublicResult<PublicBranchMenuPayload>;
type PublicTableResult = PublicResult<{ table: PublicMenuTable | null }>;

const publicBranchMenuCache = new Map<string, CacheEntry<PublicBranchMenuResult>>();
const publicTableCache = new Map<string, CacheEntry<PublicTableResult>>();

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
  return Promise.all([getCachedPublicBranchMenu(input.branchId), getCachedPublicTable(input)]).then(([menuResult, tableResult]): PublicMenuResult => {
    if (!menuResult.ok) return menuResult;
    if (!tableResult.ok) return tableResult;

    return {
      ok: true,
      data: {
        ...menuResult.data,
        table: tableResult.data.table,
      },
    };
  });
}

function getCachedPublicBranchMenu(branchId: string) {
  return getCached(publicBranchMenuCache, branchId, () => getPublicBranchMenu(branchId));
}

function getCachedPublicTable(input: PublicMenuQueryInput) {
  if (!input.tableNumber) return Promise.resolve({ ok: true, data: { table: null } } satisfies PublicTableResult);
  return getCached(publicTableCache, `${input.branchId}:${input.tableNumber}`, () => getPublicTable(input));
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
