// In-memory rate limiter — resets on server restart (acceptable for a Next.js serverless context)
// Each entry: { lastCall: timestamp, count: number }
const store = new Map<string, { lastCall: number; count: number }>()

interface RateLimitOptions {
  windowMs: number   // rolling window in milliseconds
  max: number        // max requests within the window
}

export function checkRateLimit(key: string, opts: RateLimitOptions): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now - entry.lastCall > opts.windowMs) {
    store.set(key, { lastCall: now, count: 1 })
    return { allowed: true, retryAfterMs: 0 }
  }

  if (entry.count >= opts.max) {
    const retryAfterMs = opts.windowMs - (now - entry.lastCall)
    return { allowed: false, retryAfterMs }
  }

  entry.count += 1
  entry.lastCall = now
  store.set(key, entry)
  return { allowed: true, retryAfterMs: 0 }
}
