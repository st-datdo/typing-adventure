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

export type TrustProxyHeader = 'x-real-ip' | 'x-forwarded-for' | 'none'

export function parseTrustProxyHeader(value: string | undefined): TrustProxyHeader {
  const normalized = value?.trim().toLowerCase()
  if (normalized === 'x-real-ip' || normalized === 'x-forwarded-for') return normalized
  return 'none'
}

export function getTrustedClientIp(headers: Headers, trust: TrustProxyHeader): string {
  if (trust === 'x-real-ip') {
    return headers.get('x-real-ip')?.trim() || 'unknown'
  }
  if (trust === 'x-forwarded-for') {
    const forwarded = headers.get('x-forwarded-for')?.split(',')
    return forwarded?.[forwarded.length - 1]?.trim() || 'unknown'
  }
  return 'unknown'
}

let proxyWarningLogged = false

export function warnIfProxyUntrusted(trust: TrustProxyHeader): void {
  if (proxyWarningLogged || trust !== 'none' || process.env.NODE_ENV !== 'production') return
  proxyWarningLogged = true
  console.warn(
    '[rate-limit] TRUST_PROXY_HEADER is not set to x-real-ip or x-forwarded-for in production; IP-based limits are disabled',
  )
}

export function normalizeEmail(email: unknown): string {
  return typeof email === 'string' ? email.trim().toLowerCase() : ''
}

const MAX_EMAIL_KEY_LENGTH = 254

export function limiterEmailKey(email: unknown): string {
  return normalizeEmail(email).slice(0, MAX_EMAIL_KEY_LENGTH)
}
