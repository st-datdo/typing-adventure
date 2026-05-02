import { prisma } from '@typing-adventure/db'
import { requireAdmin } from '@/lib/admin-guard'
import { ok, err } from '@/lib/api-response'

function daysAgo(n: number): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - n)
  return d
}

/** Build a complete date range with labels, filling gaps with zeros */
function fillDateRange(
  days: number,
  dataMap: Map<string, number>,
): { date: string; count: number }[] {
  return Array.from({ length: days }, (_, i) => {
    const d = daysAgo(days - 1 - i)
    const label = d.toISOString().slice(0, 10)
    return { date: label, count: dataMap.get(label) ?? 0 }
  })
}

export async function GET(request: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const url = new URL(request.url)
  const period = parseInt(url.searchParams.get('days') ?? '30', 10)
  const days = Math.min(Math.max(period, 7), 90)

  try {
    const todayStart = daysAgo(0)
    const weekAgo = daysAgo(7)
    const monthAgo = daysAgo(30)
    const rangeStart = daysAgo(days - 1)

    // Core counts + DAU/WAU/MAU + trend data — all in parallel
    const [
      totalUsers,
      totalSessions,
      sessionsToday,
      avgWpmResult,
      dauResult,
      wauResult,
      mauResult,
      activeRooms,
      sessionsInRange,
      usersInRange,
      topWordPacks,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.gameSession.count(),
      prisma.gameSession.count({
        where: { createdAt: { gte: todayStart } },
      }),
      prisma.gameSession.aggregate({ _avg: { wpm: true } }),
      prisma.gameSession.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: todayStart } },
      }),
      prisma.gameSession.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: weekAgo } },
      }),
      prisma.gameSession.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: monthAgo } },
      }),
      prisma.raceRoom.findMany({
        where: { status: { in: ['WAITING', 'COUNTDOWN', 'RACING'] } },
        select: {
          id: true,
          code: true,
          status: true,
          level: true,
          maxPlayers: true,
          createdAt: true,
          _count: { select: { results: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      // Fetch all sessions in range for trend aggregation
      prisma.gameSession.findMany({
        where: { createdAt: { gte: rangeStart } },
        select: { createdAt: true, wpm: true },
      }),
      // All users created in range
      prisma.user.findMany({
        where: { createdAt: { gte: rangeStart } },
        select: { createdAt: true },
      }),
      prisma.gameSession.groupBy({
        by: ['gameMode'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ])

    // Aggregate sessions per day from fetched data
    const sessionCountMap = new Map<string, number>()
    const wpmSumMap = new Map<string, { total: number; count: number }>()

    for (const s of sessionsInRange) {
      const dateKey = s.createdAt.toISOString().slice(0, 10)
      sessionCountMap.set(dateKey, (sessionCountMap.get(dateKey) ?? 0) + 1)

      const wpmEntry = wpmSumMap.get(dateKey) ?? { total: 0, count: 0 }
      wpmEntry.total += s.wpm
      wpmEntry.count += 1
      wpmSumMap.set(dateKey, wpmEntry)
    }

    // Aggregate user registrations per day
    const userCountMap = new Map<string, number>()
    for (const u of usersInRange) {
      const dateKey = u.createdAt.toISOString().slice(0, 10)
      userCountMap.set(dateKey, (userCountMap.get(dateKey) ?? 0) + 1)
    }

    // Build WPM trend
    const wpmTrend = Array.from({ length: days }, (_, i) => {
      const d = daysAgo(days - 1 - i)
      const label = d.toISOString().slice(0, 10)
      const entry = wpmSumMap.get(label)
      return {
        date: label,
        avgWpm: entry ? Math.round(entry.total / entry.count) : 0,
      }
    })

    return ok({
      totalUsers,
      totalSessions,
      sessionsToday,
      avgWpm: Math.round(avgWpmResult._avg.wpm ?? 0),
      dau: dauResult.length,
      wau: wauResult.length,
      mau: mauResult.length,
      dailySessions: fillDateRange(days, sessionCountMap),
      userGrowth: fillDateRange(days, userCountMap),
      wpmTrend,
      topWordPacks: topWordPacks.map((wp) => ({
        gameMode: wp.gameMode,
        count: wp._count.id,
      })),
      activeRooms: activeRooms.map((r) => ({
        id: r.id,
        code: r.code,
        status: r.status,
        level: r.level,
        maxPlayers: r.maxPlayers,
        playerCount: r._count.results,
        createdAt: r.createdAt,
      })),
    })
  } catch {
    return err('Failed to fetch admin stats', 500)
  }
}
