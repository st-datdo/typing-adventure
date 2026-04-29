import { prisma } from '@typing-adventure/db'
import { getSessionUser } from '@/lib/auth'
import { ok, err, unauthorized } from '@/lib/api-response'

export async function GET() {
  const user = await getSessionUser()
  if (!user) return unauthorized()

  try {
    const record = await prisma.userRecord.findUnique({
      where: { userId: user.id },
    })

    if (!record) {
      return ok({
        bestWpm: { easy: 0, medium: 0, hard: 0 },
        bestAccuracy: { easy: 0, medium: 0, hard: 0 },
        bestScore: { easy: 0, medium: 0, hard: 0 },
        totalGames: 0,
        totalWords: 0,
        dayStreak: 0,
        maxDayStreak: 0,
        lastPlayDate: null,
      })
    }

    return ok({
      bestWpm: record.bestWpm,
      bestAccuracy: record.bestAccuracy,
      bestScore: record.bestScore,
      totalGames: record.totalGames,
      totalWords: record.totalWords,
      dayStreak: record.dayStreak,
      maxDayStreak: record.maxDayStreak,
      lastPlayDate: record.lastPlayDate,
    })
  } catch {
    return err('Failed to fetch stats', 500)
  }
}
