import { NextRequest } from 'next/server'
import { prisma } from '@typing-adventure/db'
import { checkAchievements } from '@typing-adventure/game-engine'
import type { UserRecord as EngineRecord, HistoryEntry } from '@typing-adventure/game-engine'
import { getSessionUser } from '@/lib/auth'
import { ok, err, unauthorized } from '@/lib/api-response'

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return unauthorized()

  try {
    const body = await req.json()
    const records: EngineRecord = body.records
    const history: HistoryEntry[] = body.history ?? []

    // Get already unlocked
    const unlocked = await prisma.userAchievement.findMany({
      where: { userId: user.id },
      select: { achievementId: true },
    })
    const unlockedIds = unlocked.map((u) => u.achievementId)

    const newUnlocks = checkAchievements(records, history, unlockedIds)

    if (newUnlocks.length > 0) {
      await prisma.userAchievement.createMany({
        data: newUnlocks.map((achId) => ({
          userId: user.id,
          achievementId: achId,
        })),
        skipDuplicates: true,
      })
    }

    return ok({ newUnlocks })
  } catch {
    return err('Failed to check achievements', 500)
  }
}
