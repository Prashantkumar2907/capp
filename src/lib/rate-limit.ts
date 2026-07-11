/**
 * In-memory sliding-window rate limiter for public endpoints.
 *
 * The QR order endpoint is anonymous by design, so nothing stopped a bot (or
 * a bored kid) from flooding the kitchen with fake tickets. This caps how
 * many orders one key (branch + client IP) can place per window.
 *
 * In-memory is deliberately simple: it resets on deploy and doesn't span
 * serverless instances, but it stops the obvious abuse without adding Redis.
 * For multi-instance hardening, swap the Map for Upstash/Redis later — the
 * interface stays the same.
 */

interface Bucket {
  hits: number[];
}

const buckets = new Map<string, Bucket>();

// periodic sweep so the Map doesn't grow unbounded
let lastSweep = Date.now();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit = 8, windowMs = 60_000): RateLimitResult {
  const now = Date.now();

  if (now - lastSweep > 5 * 60_000) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.hits.every((time) => now - time > windowMs)) buckets.delete(bucketKey);
    }
    lastSweep = now;
  }

  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((time) => now - time < windowMs);

  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0];
    return { ok: false, remaining: 0, retryAfterSeconds: Math.ceil((windowMs - (now - oldest)) / 1000) };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);
  return { ok: true, remaining: limit - bucket.hits.length, retryAfterSeconds: 0 };
}

/** Best-effort client IP from proxy headers. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
