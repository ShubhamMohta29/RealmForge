/**
 * Production rate limiter backed by Upstash Redis.
 * Falls back to the in-memory limiter when UPSTASH_REDIS_REST_URL is not set
 * (e.g. local dev without credentials).
 *
 * Required env vars (set in Vercel dashboard):
 *   UPSTASH_REDIS_REST_URL   — from Upstash Console → REST API
 *   UPSTASH_REDIS_REST_TOKEN — from Upstash Console → REST API
 */

import { checkRateLimit } from './rateLimiter'
import type { Duration } from '@upstash/ratelimit'

interface UpstashResult {
  allowed: boolean
  remaining: number
  retryAfterMs: number
}

export async function checkRateLimitUpstash(
  key: string,
  opts: { requests: number; window: Duration; fallbackWindowMs?: number }
): Promise<UpstashResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    // No Upstash credentials — fall back to in-memory (acceptable for local dev)
    const fallback = checkRateLimit(key, {
      windowMs: opts.fallbackWindowMs ?? 60_000,
      max: opts.requests,
    })
    return {
      allowed: fallback.allowed,
      remaining: fallback.allowed ? opts.requests - 1 : 0,
      retryAfterMs: fallback.retryAfterMs,
    }
  }

  // Dynamic import so this module can be bundled without Upstash packages in dev
  const [{ Ratelimit }, { Redis }] = await Promise.all([
    import('@upstash/ratelimit'),
    import('@upstash/redis'),
  ])

  const limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(opts.requests, opts.window),
    analytics: true,
  })

  const result = await limiter.limit(key)
  return {
    allowed: result.success,
    remaining: result.remaining,
    retryAfterMs: result.success ? 0 : Math.max(0, result.reset - Date.now()),
  }
}
