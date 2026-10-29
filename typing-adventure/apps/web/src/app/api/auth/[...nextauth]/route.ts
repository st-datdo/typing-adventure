import { NextRequest } from 'next/server'
import { handlers } from '@/lib/auth'
import { tooManyRequests } from '@/lib/api-response'
import { createRateLimiter, getClientIp } from '@/lib/rate-limit'

const credentialsLimiter = createRateLimiter({ limit: 10, windowMs: 15 * 60 * 1000 })

export const { GET } = handlers

export async function POST(req: NextRequest) {
  if (req.nextUrl.pathname === '/api/auth/callback/credentials') {
    const rl = credentialsLimiter.check(getClientIp(req.headers))
    if (!rl.allowed) {
      return tooManyRequests(rl.retryAfterMs, `${req.nextUrl.origin}/login?error=RateLimited`)
    }
  }
  return handlers.POST(req)
}
