import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@typing-adventure/db'
import { ok, err, unauthorized } from '@/lib/api-response'
import { getSessionUser } from '@/lib/auth'

const addFriendSchema = z.object({
  receiverId: z.string().optional(),
  email: z.string().email().optional(),
}).refine(data => data.receiverId || data.email, {
  message: 'Either receiverId or email is required',
})

export async function GET(_req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return unauthorized()

  try {
    const friendships = await prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [
          { initiatorId: user.id },
          { receiverId: user.id },
        ],
      },
      include: {
        initiator: {
          select: {
            id: true,
            name: true,
            avatar: true,
            records: {
              select: {
                bestWpm: true,
                totalGames: true,
                lastPlayDate: true,
              },
            },
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true,
            records: {
              select: {
                bestWpm: true,
                totalGames: true,
                lastPlayDate: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    const friends = friendships.map(f => {
      const friend = f.initiatorId === user.id ? f.receiver : f.initiator
      const bestWpm = friend.records?.bestWpm as Record<string, number> | null
      const maxWpm = bestWpm
        ? Math.max(bestWpm.easy ?? 0, bestWpm.medium ?? 0, bestWpm.hard ?? 0)
        : 0
      return {
        friendshipId: f.id,
        id: friend.id,
        name: friend.name,
        avatar: friend.avatar,
        bestWpm: maxWpm,
        totalGames: friend.records?.totalGames ?? 0,
        lastPlayDate: friend.records?.lastPlayDate?.toISOString() ?? null,
      }
    })

    return ok(friends)
  } catch {
    return err('Failed to fetch friends', 500)
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return unauthorized()

  try {
    const body = await req.json()
    const parsed = addFriendSchema.safeParse(body)
    if (!parsed.success) {
      return err(parsed.error.errors[0].message)
    }

    let receiverId = parsed.data.receiverId

    // Look up by email if no receiverId
    if (!receiverId && parsed.data.email) {
      const target = await prisma.user.findUnique({
        where: { email: parsed.data.email },
        select: { id: true },
      })
      if (!target) return err('User not found', 404)
      receiverId = target.id
    }

    if (!receiverId) return err('Could not determine receiver')
    if (receiverId === user.id) return err('Cannot add yourself as a friend')

    // Check if friendship already exists (either direction)
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { initiatorId: user.id, receiverId },
          { initiatorId: receiverId, receiverId: user.id },
        ],
      },
    })

    if (existing) {
      if (existing.status === 'ACCEPTED') return err('Already friends')
      if (existing.status === 'PENDING') return err('Friend request already pending')
      if (existing.status === 'BLOCKED') return err('Cannot send request')
    }

    const friendship = await prisma.friendship.create({
      data: {
        initiatorId: user.id,
        receiverId,
      },
    })

    return ok(friendship)
  } catch {
    return err('Failed to send friend request', 500)
  }
}
