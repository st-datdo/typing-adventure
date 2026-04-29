import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@typing-adventure/db'
import { getSessionUser } from '@/lib/auth'
import { ok, err, unauthorized } from '@/lib/api-response'

const migrateSchema = z.object({
  records: z.object({
    bestWpm: z.record(z.number()).optional(),
    bestAccuracy: z.record(z.number()).optional(),
    bestScore: z.record(z.number()).optional(),
    totalGames: z.number().optional(),
    totalWords: z.number().optional(),
    dayStreak: z.number().optional(),
    lastPlayDate: z.string().nullable().optional(),
  }).optional(),
  history: z.array(z.object({
    date: z.string(),
    level: z.string(),
    wpm: z.number(),
    cps: z.number(),
    accuracy: z.number(),
    time: z.number(),
    wordCount: z.number(),
    score: z.number(),
    stars: z.number(),
    maxCombo: z.number().optional(),
  })).optional(),
  achievements: z.array(z.string()).optional(),
})

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return unauthorized()

  try {
    const body = await req.json()
    const parsed = migrateSchema.safeParse(body)
    if (!parsed.success) {
      return err(parsed.error.errors[0].message)
    }

    const { records, history, achievements } = parsed.data

    // Merge records — keep the better value
    if (records) {
      const existing = await prisma.userRecord.findUnique({
        where: { userId: user.id },
      })

      const existingBestWpm = (existing?.bestWpm as Record<string, number>) ?? {}
      const existingBestAcc = (existing?.bestAccuracy as Record<string, number>) ?? {}
      const existingBestScore = (existing?.bestScore as Record<string, number>) ?? {}

      const mergedWpm = { ...existingBestWpm }
      const mergedAcc = { ...existingBestAcc }
      const mergedScore = { ...existingBestScore }

      for (const [k, v] of Object.entries(records.bestWpm ?? {})) {
        mergedWpm[k] = Math.max(mergedWpm[k] ?? 0, v)
      }
      for (const [k, v] of Object.entries(records.bestAccuracy ?? {})) {
        mergedAcc[k] = Math.max(mergedAcc[k] ?? 0, v)
      }
      for (const [k, v] of Object.entries(records.bestScore ?? {})) {
        mergedScore[k] = Math.max(mergedScore[k] ?? 0, v)
      }

      await prisma.userRecord.upsert({
        where: { userId: user.id },
        update: {
          bestWpm: mergedWpm,
          bestAccuracy: mergedAcc,
          bestScore: mergedScore,
          totalGames: (existing?.totalGames ?? 0) + (records.totalGames ?? 0),
          totalWords: (existing?.totalWords ?? 0) + (records.totalWords ?? 0),
          dayStreak: Math.max(existing?.dayStreak ?? 0, records.dayStreak ?? 0),
        },
        create: {
          userId: user.id,
          bestWpm: mergedWpm,
          bestAccuracy: mergedAcc,
          bestScore: mergedScore,
          totalGames: records.totalGames ?? 0,
          totalWords: records.totalWords ?? 0,
          dayStreak: records.dayStreak ?? 0,
        },
      })
    }

    // Import history as game sessions
    if (history && history.length > 0) {
      await prisma.gameSession.createMany({
        data: history.map((h) => ({
          userId: user.id,
          gameMode: 'classic',
          level: h.level,
          wpm: h.wpm,
          cps: h.cps,
          accuracy: h.accuracy,
          score: h.score,
          stars: h.stars,
          timeSeconds: h.time,
          wordCount: h.wordCount,
          maxCombo: h.maxCombo ?? 0,
          createdAt: new Date(h.date),
        })),
        skipDuplicates: true,
      })
    }

    // Import achievements
    if (achievements && achievements.length > 0) {
      for (const achId of achievements) {
        await prisma.userAchievement.upsert({
          where: { userId_achievementId: { userId: user.id, achievementId: achId } },
          update: {},
          create: { userId: user.id, achievementId: achId },
        })
      }
    }

    return ok({ migrated: true })
  } catch {
    return err('Migration failed', 500)
  }
}
