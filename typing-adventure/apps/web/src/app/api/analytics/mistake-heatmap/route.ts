import { prisma } from '@typing-adventure/db'
import { requireAdmin } from '@/lib/admin-guard'
import { ok, err } from '@/lib/api-response'
import { safeMistakeMap } from '@/lib/mistake-map'

const MAX_SESSIONS = 10_000

export async function GET(request: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const url = new URL(request.url)
  const period = url.searchParams.get('period') ?? 'weekly'

  try {
    const now = new Date()
    const startDate = new Date(now)

    if (period === 'daily') {
      startDate.setDate(startDate.getDate() - 1)
    } else if (period === 'weekly') {
      startDate.setDate(startDate.getDate() - 7)
    } else if (period === 'monthly') {
      startDate.setMonth(startDate.getMonth() - 1)
    } else {
      // all time — cap to last 365 days
      startDate.setFullYear(startDate.getFullYear() - 1)
    }

    const sessions = await prisma.gameSession.findMany({
      where: { createdAt: { gte: startDate } },
      select: { mistakeMap: true },
      take: MAX_SESSIONS,
      orderBy: { createdAt: 'desc' },
    })

    const aggregate: Record<string, number> = {}
    for (const session of sessions) {
      const map = safeMistakeMap(session.mistakeMap)
      for (const [key, count] of Object.entries(map)) {
        aggregate[key] = (aggregate[key] ?? 0) + count
      }
    }

    return ok(aggregate)
  } catch {
    return err('Failed to fetch mistake heatmap', 500)
  }
}
