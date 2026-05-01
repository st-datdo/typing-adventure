import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@typing-adventure/db'
import { requireAdmin } from '@/lib/admin-guard'
import { ok, err } from '@/lib/api-response'

const updateSchema = z.object({
  role: z.enum(['USER', 'ADMIN']).optional(),
})

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PUT(
  req: NextRequest,
  context: RouteContext,
) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await context.params

  try {
    const existing = await prisma.user.findUnique({ where: { id } })
    if (!existing) return err('User not found', 404)

    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return err(parsed.error.errors[0].message)
    }

    const user = await prisma.user.update({
      where: { id },
      data: parsed.data,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
      },
    })

    return ok(user)
  } catch {
    return err('Failed to update user', 500)
  }
}
