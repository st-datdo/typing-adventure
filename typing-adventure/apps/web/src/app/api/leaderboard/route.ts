import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@typing-adventure/db'
import { ok, err } from '@/lib/api-response'

const querySchema = z.object({
  mode: z.enum(['classic', 'lesson', 'timeAttack', 'challenge']).default('classic'),
  level: z.enum(['easy', 'medium', 'hard']).default('medium'),
  period: z.enum(['all', 'weekly', 'daily']).default('all'),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

function getPeriodStart(period: 'all' | 'weekly' | 'daily'): Date | null {
  if (period === 'all') return null
  const now = new Date()
  if (period === 'daily') {
    now.setHours(0, 0, 0, 0)
    return now
  }
  // weekly: start of current week (Monday)
  const day = now.getDay()
  const diff = day === 0 ? 6 : day - 1
  now.setDate(now.getDate() - diff)
  now.setHours(0, 0, 0, 0)
  return now
}

function maskName(name: string | null): string {
  if (!name || name.length <= 3) return name ?? '***'
  return name.slice(0, 3) + '***'
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const raw = Object.fromEntries(url.searchParams)
  const parsed = querySchema.safeParse(raw)
  if (!parsed.success) {
    return err(parsed.error.errors[0].message)
  }

  const { mode, level, period, limit, offset } = parsed.data
  const periodStart = getPeriodStart(period)

  try {
    const where: Record<string, unknown> = {
      gameMode: mode,
      level,
    }
    if (periodStart) {
      where.createdAt = { gte: periodStart }
    }

    // Get best score per user for the given mode/level/period
    // We use a raw query approach: get top sessions grouped by user
    const sessions = await prisma.gameSession.findMany({
      where: where as any,
      orderBy: { score: 'desc' },
      distinct: ['userId'],
      take: limit,
      skip: offset,
      select: {
        userId: true,
        wpm: true,
        accuracy: true,
        score: true,
        user: {
          select: {
            name: true,
            avatar: true,
          },
        },
      },
    })

    const total = await prisma.gameSession.groupBy({
      by: ['userId'],
      where: where as any,
    }).then(r => r.length)

    const leaderboard = sessions.map((s, i) => ({
      rank: offset + i + 1,
      userId: s.userId,
      name: maskName(s.user.name),
      avatar: s.user.avatar,
      wpm: s.wpm,
      accuracy: s.accuracy,
      score: s.score,
    }))

    return ok(leaderboard, { total, page: Math.floor(offset / limit) + 1, limit })
  } catch {
    return err('Failed to fetch leaderboard', 500)
  }
}
