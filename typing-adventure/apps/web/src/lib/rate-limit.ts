export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterMs: number
}

export interface RateLimiterOptions {
  limit: number
  windowMs: number
  now?: () => number
}

export interface RateLimiter {
  check(key: string): RateLimitResult
  size(): number
}

interface Bucket {
  count: number
  resetAt: number
}

export function createRateLimiter({
  limit,
  windowMs,
  now = Date.now,
}: RateLimiterOptions): RateLimiter {
  const buckets = new Map<string, Bucket>()
  let lastSweep = now()

  function sweep(current: number) {
    if (current - lastSweep < windowMs) return
    lastSweep = current
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= current) buckets.delete(key)
    }
  }

  return {
    check(key) {
      const current = now()
      sweep(current)

      let bucket = buckets.get(key)
      if (!bucket || bucket.resetAt <= current) {
        bucket = { count: 0, resetAt: current + windowMs }
        buckets.set(key, bucket)
      }

      if (bucket.count >= limit) {
        return { allowed: false, remaining: 0, retryAfterMs: bucket.resetAt - current }
      }

      bucket.count += 1
      return { allowed: true, remaining: limit - bucket.count, retryAfterMs: 0 }
    },
    size() {
      return buckets.size
    },
  }
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  const first = forwarded?.split(',')[0]?.trim()
  if (first) return first
  return headers.get('x-real-ip')?.trim() || 'unknown'
}
