import { getPublicBranchMenu, getPublicMenuMeta, getPublicTable } from "@/lib/supabase/public";
import type {
  PublicBranchMenuPayload,
  PublicMenuMetaPayload,
  PublicMenuPayload,
  PublicMenuTable,
  PublicResult,
} from "@/lib/supabase/public";
import type { PublicMenuQueryInput } from "@/lib/validation/schemas";

const FRESH_MS = 30_000;
const STALE_MS = 300_000;

type PublicMenuResult =
  | { ok: true; data: PublicMenuPayload }
  | { ok: false; status: number; code: string; message: string };
type PublicBranchMenuResult = PublicResult<PublicBranchMenuPayload>;
type PublicTableResult = PublicResult<{ table: PublicMenuTable | null }>;
type PublicMenuMetaResult = PublicResult<PublicMenuMetaPayload>;

type CacheEntry<T> = {
  freshUntil: number;
  staleUntil: number;
  result?: T;
  pending?: Promise<T>;
};

type WarmPublicMenuInput = {
  branchId: string;
  tableNumber?: number;
};

const publicBranchMenuCache = new Map<string, CacheEntry<PublicBranchMenuResult>>();
const publicTableCache = new Map<string, CacheEntry<PublicTableResult>>();
const publicMenuMetaCache = new Map<string, CacheEntry<PublicMenuMetaResult>>();

export function getCachedPublicMenu(input: PublicMenuQueryInput) {
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

export function getCachedPublicMenuMeta(input: WarmPublicMenuInput) {
  return getCached(publicMenuMetaCache, `${input.branchId}:${input.tableNumber ?? "none"}`, () => getPublicMenuMeta(input));
}

export function warmPublicMenuCaches(inputs = defaultPublicMenuWarmups()) {
  return Promise.allSettled(
    inputs.flatMap((input) => [
      getCachedPublicMenu({ branchId: input.branchId, tableNumber: input.tableNumber }),
      getCachedPublicMenuMeta(input),
    ])
  );
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

function defaultPublicMenuWarmups(): WarmPublicMenuInput[] {
  const configured = process.env.CAPP_PUBLIC_MENU_WARMUPS;
  if (configured) return parseWarmups(configured);

  return [
    { branchId: "b0000000-0000-0000-0000-000000000099", tableNumber: 1 },
  ];
}

function parseWarmups(value: string): WarmPublicMenuInput[] {
  return value
    .split(",")
    .map((entry): WarmPublicMenuInput | null => {
      const [branchId, tableNumber] = entry.trim().split(":");
      if (!branchId) return null;

      const parsedTableNumber = Number(tableNumber);
      return {
        branchId,
        tableNumber: Number.isInteger(parsedTableNumber) && parsedTableNumber > 0 ? parsedTableNumber : undefined,
      };
    })
    .filter((entry): entry is WarmPublicMenuInput => entry !== null);
}
