import { NextRequest } from 'next/server'
import { prisma } from '@typing-adventure/db'
import { ok, err, unauthorized } from '@/lib/api-response'
import { getSessionUser } from '@/lib/auth'

export async function GET(_req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return unauthorized()

  try {
    const [received, sent] = await Promise.all([
      prisma.friendship.findMany({
        where: { receiverId: user.id, status: 'PENDING' },
        include: {
          initiator: {
            select: { id: true, name: true, avatar: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.friendship.findMany({
        where: { initiatorId: user.id, status: 'PENDING' },
        include: {
          receiver: {
            select: { id: true, name: true, avatar: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    const receivedMapped = received.map(f => ({
      friendshipId: f.id,
      type: 'received' as const,
      user: f.initiator,
      createdAt: f.createdAt,
    }))

    const sentMapped = sent.map(f => ({
      friendshipId: f.id,
      type: 'sent' as const,
      user: f.receiver,
      createdAt: f.createdAt,
    }))

    return ok({ received: receivedMapped, sent: sentMapped })
  } catch {
    return err('Failed to fetch friend requests', 500)
  }
}
