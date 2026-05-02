import { prisma } from '@typing-adventure/db'
import { requireAdmin } from '@/lib/admin-guard'
import { ok, err } from '@/lib/api-response'

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
      // all time — no date filter
      startDate.setFullYear(2000)
    }

    const sessions = await prisma.gameSession.findMany({
      where: { createdAt: { gte: startDate } },
      select: { mistakeMap: true },
    })

    const aggregate: Record<string, number> = {}
    for (const session of sessions) {
      const map = session.mistakeMap as Record<string, number>
      for (const [key, count] of Object.entries(map)) {
        aggregate[key] = (aggregate[key] ?? 0) + count
      }
    }

    return ok(aggregate)
  } catch {
    return err('Failed to fetch mistake heatmap', 500)
  }
}
