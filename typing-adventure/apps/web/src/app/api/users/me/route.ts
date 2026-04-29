import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@typing-adventure/db'
import { getSessionUser } from '@/lib/auth'
import { ok, err, unauthorized } from '@/lib/api-response'

export async function GET() {
  const sessionUser = await getSessionUser()
  if (!sessionUser) return unauthorized()

  try {
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        settings: true,
        role: true,
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
            lastPlayDate: true,
          },
        },
      },
    })

    if (!user) return err('User not found', 404)
    return ok(user)
  } catch {
    return err('Failed to fetch profile', 500)
  }
}

const updateProfileSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  avatar: z.string().optional(),
})

export async function PUT(req: NextRequest) {
  const sessionUser = await getSessionUser()
  if (!sessionUser) return unauthorized()

  try {
    const body = await req.json()
    const parsed = updateProfileSchema.safeParse(body)
    if (!parsed.success) {
      return err(parsed.error.errors[0].message)
    }

    const user = await prisma.user.update({
      where: { id: sessionUser.id },
      data: parsed.data,
      select: { id: true, name: true, email: true, avatar: true },
    })

    return ok(user)
  } catch {
    return err('Failed to update profile', 500)
  }
}
