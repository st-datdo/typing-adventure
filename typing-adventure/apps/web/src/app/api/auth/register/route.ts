import { NextRequest } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@typing-adventure/db'
import { ok, err, tooManyRequests } from '@/lib/api-response'
import {
  createRateLimiter,
  getTrustedClientIp,
  parseTrustProxyHeader,
  warnIfProxyUntrusted,
} from '@/lib/rate-limit'

const registerLimiter = createRateLimiter({ limit: 5, windowMs: 15 * 60 * 1000 })

const registerSchema = z.object({
  name: z.string().min(1).max(50),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  avatar: z.string().default('🧒'),
})

export async function POST(req: NextRequest) {
  const trust = parseTrustProxyHeader(process.env.TRUST_PROXY_HEADER)
  warnIfProxyUntrusted(trust)
  const ip = getTrustedClientIp(req.headers, trust)
  if (ip !== 'unknown') {
    const rl = registerLimiter.check(ip)
    if (!rl.allowed) return tooManyRequests(rl.retryAfterMs)
  }

  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      return err(parsed.error.errors[0].message)
    }

    const { name, email, password, avatar } = parsed.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return err('Email already registered', 409)
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        avatar,
        records: { create: {} },
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: true,
      },
    })

    return ok(user)
  } catch {
    return err('Internal server error', 500)
  }
}
