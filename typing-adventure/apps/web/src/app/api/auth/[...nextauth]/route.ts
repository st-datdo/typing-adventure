import { NextRequest } from 'next/server'
import { handlers } from '@/lib/auth'
import { err, tooManyRequests } from '@/lib/api-response'
import {
  createRateLimiter,
  getTrustedClientIp,
  limiterEmailKey,
  parseTrustProxyHeader,
  warnIfProxyUntrusted,
} from '@/lib/rate-limit'

const WINDOW_MS = 15 * 60 * 1000
const credentialsLimiter = createRateLimiter({ limit: 10, windowMs: WINDOW_MS })
const credentialsIpLimiter = createRateLimiter({ limit: 30, windowMs: WINDOW_MS })

export const { GET } = handlers

const MAX_EMAIL_LENGTH = 254

async function readEmail(req: NextRequest): Promise<string | null> {
  const contentType = req.headers.get('content-type') ?? ''
  let raw = ''
  try {
    if (contentType.includes('application/json')) {
      const body = await req.clone().json()
      const value: unknown = body && typeof body === 'object' && 'email' in body ? body.email : ''
      if (typeof value !== 'string') return null
      raw = value
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const emails = new URLSearchParams(await req.clone().text()).getAll('email')
      if (emails.length > 1) return null
      raw = emails[0] ?? ''
    }
  } catch {
    return null
  }
  if (raw.trim().length > MAX_EMAIL_LENGTH) return null
  return limiterEmailKey(raw)
}

export async function POST(req: NextRequest) {
  if (req.nextUrl.pathname === '/api/auth/callback/credentials') {
    const trust = parseTrustProxyHeader(process.env.TRUST_PROXY_HEADER)
    warnIfProxyUntrusted(trust)
    const email = await readEmail(req)
    if (email === null) return err('Invalid credentials request')
    const loginUrl = `${req.nextUrl.origin}/login?error=RateLimited`
    const ip = getTrustedClientIp(req.headers, trust)
    if (ip !== 'unknown') {
      const ipRl = credentialsIpLimiter.check(ip)
      if (!ipRl.allowed) return tooManyRequests(ipRl.retryAfterMs, loginUrl)
    }
    const rl = credentialsLimiter.check(`${ip}|${email}`)
    if (!rl.allowed) return tooManyRequests(rl.retryAfterMs, loginUrl)
  }
  return handlers.POST(req)
}
