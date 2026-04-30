import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@typing-adventure/db'
import { ok, err, unauthorized } from '@/lib/api-response'
import { getSessionUser } from '@/lib/auth'

const querySchema = z.object({
  mode: z.enum(['classic', 'lesson', 'timeAttack', 'challenge']).default('classic'),
  level: z.enum(['easy', 'medium', 'hard']).default('medium'),
})

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return unauthorized()

  const url = new URL(req.url)
  const raw = Object.fromEntries(url.searchParams)
  const parsed = querySchema.safeParse(raw)
  if (!parsed.success) {
    return err(parsed.error.errors[0].message)
  }

  const { mode, level } = parsed.data

  try {
    // Get accepted friend IDs
    const friendships = await prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [
          { initiatorId: user.id },
          { receiverId: user.id },
        ],
      },
      select: {
        initiatorId: true,
        receiverId: true,
      },
    })

    const friendIds = friendships.map(f =>
      f.initiatorId === user.id ? f.receiverId : f.initiatorId,
    )
    // Include self in the leaderboard
    const userIds = [user.id, ...friendIds]

    const sessions = await prisma.gameSession.findMany({
      where: {
        userId: { in: userIds },
        gameMode: mode,
        level,
      },
      orderBy: { score: 'desc' },
      distinct: ['userId'],
      take: 50,
      select: {
        userId: true,
        wpm: true,
        accuracy: true,
        score: true,
        user: {
          select: {
            name: true,
            avatar: true,
          },
        },
      },
    })

    const leaderboard = sessions.map((s, i) => ({
      rank: i + 1,
      userId: s.userId,
      name: s.user.name ?? '***',
      avatar: s.user.avatar,
      wpm: s.wpm,
      accuracy: s.accuracy,
      score: s.score,
      isMe: s.userId === user.id,
    }))

    return ok(leaderboard)
  } catch {
    return err('Failed to fetch friends leaderboard', 500)
  }
}
