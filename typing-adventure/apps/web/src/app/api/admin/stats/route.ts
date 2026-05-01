import { prisma } from '@typing-adventure/db'
import { requireAdmin } from '@/lib/admin-guard'
import { ok, err } from '@/lib/api-response'

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const [totalUsers, totalSessions, sessionsToday, avgWpmResult, dailySessions] = await Promise.all([
      prisma.user.count(),
      prisma.gameSession.count(),
      prisma.gameSession.count({
        where: { createdAt: { gte: todayStart } },
      }),
      prisma.gameSession.aggregate({
        _avg: { wpm: true },
      }),
      // Sessions per day for last 7 days
      Promise.all(
        Array.from({ length: 7 }, (_, i) => {
          const dayStart = new Date(todayStart)
          dayStart.setDate(dayStart.getDate() - (6 - i))
          const dayEnd = new Date(dayStart)
          dayEnd.setDate(dayEnd.getDate() + 1)
          return prisma.gameSession.count({
            where: { createdAt: { gte: dayStart, lt: dayEnd } },
          }).then((count) => ({
            date: dayStart.toISOString().slice(0, 10),
            count,
          }))
        }),
      ),
    ])

    // User growth: users created per day last 7 days
    const userGrowth = await Promise.all(
      Array.from({ length: 7 }, (_, i) => {
        const dayStart = new Date(todayStart)
        dayStart.setDate(dayStart.getDate() - (6 - i))
        const dayEnd = new Date(dayStart)
        dayEnd.setDate(dayEnd.getDate() + 1)
        return prisma.user.count({
          where: { createdAt: { gte: dayStart, lt: dayEnd } },
        }).then((count) => ({
          date: dayStart.toISOString().slice(0, 10),
          count,
        }))
      }),
    )

    return ok({
      totalUsers,
      totalSessions,
      sessionsToday,
      avgWpm: Math.round(avgWpmResult._avg.wpm ?? 0),
      dailySessions,
      userGrowth,
    })
  } catch {
    return err('Failed to fetch admin stats', 500)
  }
}
