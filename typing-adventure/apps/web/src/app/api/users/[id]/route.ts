import { NextRequest } from 'next/server'
import { prisma } from '@typing-adventure/db'
import { ok, err } from '@/lib/api-response'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        avatar: true,
        createdAt: true,
        records: {
          select: {
            bestWpm: true,
            bestAccuracy: true,
            bestScore: true,
            totalGames: true,
            totalWords: true,
            dayStreak: true,
            maxDayStreak: true,
          },
        },
        achievements: {
          select: {
            achievementId: true,
            unlockedAt: true,
          },
          orderBy: { unlockedAt: 'desc' },
        },
        raceResults: {
          select: {
            wpm: true,
            accuracy: true,
            position: true,
            finishTime: true,
            createdAt: true,
            room: {
              select: {
                code: true,
                level: true,
                maxPlayers: true,
                _count: { select: { results: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    })

    if (!user) return err('User not found', 404)
    return ok(user)
  } catch {
    return err('Failed to fetch user', 500)
  }
}
