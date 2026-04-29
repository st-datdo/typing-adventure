import { prisma } from '@typing-adventure/db'
import { ACHIEVEMENTS } from '@typing-adventure/game-engine'
import { getSessionUser } from '@/lib/auth'
import { ok, err, unauthorized } from '@/lib/api-response'

export async function GET() {
  const user = await getSessionUser()
  if (!user) return unauthorized()

  try {
    const unlocked = await prisma.userAchievement.findMany({
      where: { userId: user.id },
      select: { achievementId: true, unlockedAt: true },
    })

    const unlockedMap = new Map(unlocked.map((u) => [u.achievementId, u.unlockedAt]))

    const all = ACHIEVEMENTS.map((ach) => ({
      id: ach.id,
      icon: ach.icon,
      nameKey: ach.nameKey,
      descKey: ach.descKey,
      unlocked: unlockedMap.has(ach.id),
      unlockedAt: unlockedMap.get(ach.id) ?? null,
    }))

    return ok(all)
  } catch {
    return err('Failed to fetch achievements', 500)
  }
}
