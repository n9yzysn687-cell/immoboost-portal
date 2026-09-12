import { createHash } from "node:crypto";

type Bucket = { count: number; resetAt: number };

const globalBuckets = globalThis as typeof globalThis & {
  __immoboostRateLimits?: Map<string, Bucket>;
};

const buckets = globalBuckets.__immoboostRateLimits ?? new Map<string, Bucket>();
globalBuckets.__immoboostRateLimits = buckets;

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function hashRateLimitKey(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

export function consumeRateLimit(
  key: string,
  options: { limit: number; windowMs: number; now?: number },
): RateLimitResult {
  const now = options.now ?? Date.now();
  const existing = buckets.get(key);
  const bucket = !existing || existing.resetAt <= now
    ? { count: 0, resetAt: now + options.windowMs }
    : existing;

  bucket.count += 1;
  buckets.set(key, bucket);

  if (buckets.size > 5_000) {
    for (const [candidate, value] of buckets) {
      if (value.resetAt <= now) buckets.delete(candidate);
    }
  }

  return {
    allowed: bucket.count <= options.limit,
    remaining: Math.max(0, options.limit - bucket.count),
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1_000)),
  };
}

export function clearRateLimitsForTests() {
  buckets.clear();
}
