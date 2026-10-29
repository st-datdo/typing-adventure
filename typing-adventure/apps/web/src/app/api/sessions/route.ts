import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@typing-adventure/db'
import { getSessionUser } from '@/lib/auth'
import { ok, err, unauthorized, tooManyRequests } from '@/lib/api-response'
import { createRateLimiter } from '@/lib/rate-limit'

const sessionsLimiter = createRateLimiter({ limit: 30, windowMs: 60 * 1000 })

const createSessionSchema = z.object({
  gameMode: z.enum(['classic', 'lesson', 'timeAttack', 'challenge']),
  level: z.enum(['easy', 'medium', 'hard']),
  lessonIndex: z.number().int().optional(),
  wpm: z.number().int().min(0),
  cps: z.number().min(0),
  accuracy: z.number().int().min(0).max(100),
  score: z.number().int().min(0),
  stars: z.number().int().min(1).max(3),
  timeSeconds: z.number().min(0),
  wordCount: z.number().int().min(0),
  maxCombo: z.number().int().min(0).default(0),
  mistakeMap: z.record(z.number()).default({}),
  textContent: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return unauthorized()

  const rl = sessionsLimiter.check(user.id)
  if (!rl.allowed) return tooManyRequests(rl.retryAfterMs)

  try {
    const body = await req.json()
    const parsed = createSessionSchema.safeParse(body)
    if (!parsed.success) {
      return err(parsed.error.errors[0].message)
    }

    const data = parsed.data

    const session = await prisma.gameSession.create({
      data: {
        userId: user.id,
        gameMode: data.gameMode,
        level: data.level,
        lessonIndex: data.lessonIndex,
        wpm: data.wpm,
        cps: data.cps,
        accuracy: data.accuracy,
        score: data.score,
        stars: data.stars,
        timeSeconds: data.timeSeconds,
        wordCount: data.wordCount,
        maxCombo: data.maxCombo,
        mistakeMap: data.mistakeMap,
        textContent: data.textContent,
      },
    })

    // Update user records
    const record = await prisma.userRecord.findUnique({
      where: { userId: user.id },
    })

    const bestWpm = (record?.bestWpm as Record<string, number>) ?? { easy: 0, medium: 0, hard: 0 }
    const bestAcc = (record?.bestAccuracy as Record<string, number>) ?? { easy: 0, medium: 0, hard: 0 }
    const bestScore = (record?.bestScore as Record<string, number>) ?? { easy: 0, medium: 0, hard: 0 }

    const newBestWpm = { ...bestWpm }
    const newBestAcc = { ...bestAcc }
    const newBestScore = { ...bestScore }

    if (data.wpm > (newBestWpm[data.level] ?? 0)) newBestWpm[data.level] = data.wpm
    if (data.accuracy > (newBestAcc[data.level] ?? 0)) newBestAcc[data.level] = data.accuracy
    if (data.score > (newBestScore[data.level] ?? 0)) newBestScore[data.level] = data.score

    const today = new Date().toISOString().slice(0, 10)
    const lastDate = record?.lastPlayDate
      ? record.lastPlayDate.toISOString().slice(0, 10)
      : null
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

    let dayStreak = record?.dayStreak ?? 0
    if (lastDate !== today) {
      dayStreak = lastDate === yesterday ? dayStreak + 1 : 1
    }

    const updatedRecord = await prisma.userRecord.upsert({
      where: { userId: user.id },
      update: {
        bestWpm: newBestWpm,
        bestAccuracy: newBestAcc,
        bestScore: newBestScore,
        totalGames: { increment: 1 },
        totalWords: { increment: data.wordCount },
        dayStreak,
        maxDayStreak: Math.max(record?.maxDayStreak ?? 0, dayStreak),
        lastPlayDate: new Date(),
      },
      create: {
        userId: user.id,
        bestWpm: newBestWpm,
        bestAccuracy: newBestAcc,
        bestScore: newBestScore,
        totalGames: 1,
        totalWords: data.wordCount,
        dayStreak: 1,
        maxDayStreak: 1,
        lastPlayDate: new Date(),
      },
    })

    return ok({ session, records: updatedRecord })
  } catch {
    return err('Failed to save session', 500)
  }
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return unauthorized()

  const url = new URL(req.url)
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'))
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20')))
  const offset = (page - 1) * limit

  try {
    const [sessions, total] = await Promise.all([
      prisma.gameSession.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.gameSession.count({ where: { userId: user.id } }),
    ])

    return ok(sessions, { total, page, limit })
  } catch {
    return err('Failed to fetch sessions', 500)
  }
}
