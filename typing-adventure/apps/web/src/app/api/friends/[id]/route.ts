import { NextRequest } from 'next/server'
import { prisma } from '@typing-adventure/db'
import { ok, err, unauthorized } from '@/lib/api-response'
import { getSessionUser } from '@/lib/auth'

export async function PUT(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser()
  if (!user) return unauthorized()

  const { id } = await params

  try {
    const friendship = await prisma.friendship.findUnique({
      where: { id },
    })

    if (!friendship) return err('Friend request not found', 404)

    // Only the receiver can accept
    if (friendship.receiverId !== user.id) {
      return err('Only the receiver can accept this request', 403)
    }

    if (friendship.status !== 'PENDING') {
      return err('Request is not pending')
    }

    const updated = await prisma.friendship.update({
      where: { id },
      data: { status: 'ACCEPTED' },
    })

    return ok(updated)
  } catch {
    return err('Failed to accept friend request', 500)
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser()
  if (!user) return unauthorized()

  const { id } = await params

  try {
    const friendship = await prisma.friendship.findUnique({
      where: { id },
    })

    if (!friendship) return err('Friendship not found', 404)

    // Either party can delete/reject
    if (friendship.initiatorId !== user.id && friendship.receiverId !== user.id) {
      return err('Not authorized', 403)
    }

    await prisma.friendship.delete({ where: { id } })

    return ok({ deleted: true })
  } catch {
    return err('Failed to remove friendship', 500)
  }
}
