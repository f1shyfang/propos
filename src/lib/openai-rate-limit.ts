import type { NextRequest } from 'next/server';

export type OpenAiRateLimitOperation = 'transcribe' | 'parse';

type RateLimitConfig = {
  max: number;
  windowMs: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

const DEFAULTS: Record<OpenAiRateLimitOperation, RateLimitConfig> = {
  transcribe: { max: 5, windowMs: 15 * 60 * 1000 },
  parse: { max: 20, windowMs: 15 * 60 * 1000 },
};

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function configFor(operation: OpenAiRateLimitOperation): RateLimitConfig {
  const defaults = DEFAULTS[operation];
  const prefix = `OPENAI_RATE_LIMIT_${operation.toUpperCase()}`;
  return {
    max: parsePositiveInt(process.env[`${prefix}_MAX`], defaults.max),
    windowMs: parsePositiveInt(process.env[`${prefix}_WINDOW_MS`], defaults.windowMs),
  };
}

export function getClientRateLimitKey(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip =
    forwarded?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip')?.trim() ||
    'unknown';
  return ip;
}

function bucketKey(clientKey: string, operation: OpenAiRateLimitOperation): string {
  return `${operation}:${clientKey}`;
}

function pruneExpiredBuckets(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitCheckResult =
  | { allowed: true }
  | { allowed: false; retryAfterSec: number };

export function checkOpenAiRateLimit(
  clientKey: string,
  operation: OpenAiRateLimitOperation,
  now = Date.now(),
): RateLimitCheckResult {
  const { max, windowMs } = configFor(operation);
  const key = bucketKey(clientKey, operation);
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) pruneExpiredBuckets(now);
    return { allowed: true };
  }

  if (existing.count < max) {
    existing.count += 1;
    return { allowed: true };
  }

  const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  return { allowed: false, retryAfterSec };
}

/** @internal Resets in-memory counters — for tests only. */
export function resetOpenAiRateLimitsForTests(): void {
  buckets.clear();
}
