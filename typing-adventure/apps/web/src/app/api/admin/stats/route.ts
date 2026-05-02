import { prisma } from '@typing-adventure/db'
import { requireAdmin } from '@/lib/admin-guard'
import { ok, err } from '@/lib/api-response'

function daysAgo(n: number): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - n)
  return d
}

function dateRange(days: number) {
  return Array.from({ length: days }, (_, i) => {
    const start = daysAgo(days - 1 - i)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    return { start, end, label: start.toISOString().slice(0, 10) }
  })
}

export async function GET(request: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const url = new URL(request.url)
  const period = parseInt(url.searchParams.get('days') ?? '30', 10)
  const days = Math.min(Math.max(period, 7), 90)

  try {
    const now = new Date()
    const todayStart = daysAgo(0)
    const weekAgo = daysAgo(7)
    const monthAgo = daysAgo(30)

    const range = dateRange(days)

    // Core counts + DAU/WAU/MAU
    const [
      totalUsers,
      totalSessions,
      sessionsToday,
      avgWpmResult,
      dauResult,
      wauResult,
      mauResult,
      activeRooms,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.gameSession.count(),
      prisma.gameSession.count({
        where: { createdAt: { gte: todayStart } },
      }),
      prisma.gameSession.aggregate({ _avg: { wpm: true } }),
      // DAU: unique users who played today
      prisma.gameSession.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: todayStart } },
      }),
      // WAU: unique users who played last 7 days
      prisma.gameSession.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: weekAgo } },
      }),
      // MAU: unique users who played last 30 days
      prisma.gameSession.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: monthAgo } },
      }),
      // Active race rooms (WAITING or RACING)
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
    ])

    // Sessions per day
    const dailySessions = await Promise.all(
      range.map(({ start, end, label }) =>
        prisma.gameSession
          .count({ where: { createdAt: { gte: start, lt: end } } })
          .then((count) => ({ date: label, count })),
      ),
    )

    // User registration trend
    const userGrowth = await Promise.all(
      range.map(({ start, end, label }) =>
        prisma.user
          .count({ where: { createdAt: { gte: start, lt: end } } })
          .then((count) => ({ date: label, count })),
      ),
    )

    // Average WPM trend per day
    const wpmTrend = await Promise.all(
      range.map(({ start, end, label }) =>
        prisma.gameSession
          .aggregate({
            _avg: { wpm: true },
            where: { createdAt: { gte: start, lt: end } },
          })
          .then((r) => ({ date: label, avgWpm: Math.round(r._avg.wpm ?? 0) })),
      ),
    )

    // Top word packs (most played)
    const topWordPacks = await prisma.gameSession.groupBy({
      by: ['gameMode'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    })

    return ok({
      totalUsers,
      totalSessions,
      sessionsToday,
      avgWpm: Math.round(avgWpmResult._avg.wpm ?? 0),
      dau: dauResult.length,
      wau: wauResult.length,
      mau: mauResult.length,
      dailySessions,
      userGrowth,
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
