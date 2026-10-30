import { NextRequest } from 'next/server'
import { handlers } from '@/lib/auth'
import { tooManyRequests } from '@/lib/api-response'
import {
  createRateLimiter,
  getTrustedClientIp,
  normalizeEmail,
  parseTrustProxyHeader,
} from '@/lib/rate-limit'

const WINDOW_MS = 15 * 60 * 1000
const credentialsLimiter = createRateLimiter({ limit: 10, windowMs: WINDOW_MS })
const credentialsIpLimiter = createRateLimiter({ limit: 30, windowMs: WINDOW_MS })

export const { GET } = handlers

async function readEmail(req: NextRequest): Promise<string> {
  try {
    const form = await req.clone().formData()
    return normalizeEmail(form.get('email'))
  } catch {
    return ''
  }
}

export async function POST(req: NextRequest) {
  if (req.nextUrl.pathname === '/api/auth/callback/credentials') {
    const loginUrl = `${req.nextUrl.origin}/login?error=RateLimited`
    const ip = getTrustedClientIp(
      req.headers,
      parseTrustProxyHeader(process.env.TRUST_PROXY_HEADER),
    )
    if (ip !== 'unknown') {
      const ipRl = credentialsIpLimiter.check(ip)
      if (!ipRl.allowed) return tooManyRequests(ipRl.retryAfterMs, loginUrl)
    }
    const email = await readEmail(req)
    const rl = credentialsLimiter.check(`${ip}|${email}`)
    if (!rl.allowed) return tooManyRequests(rl.retryAfterMs, loginUrl)
  }
  return handlers.POST(req)
}
