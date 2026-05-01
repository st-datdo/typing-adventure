import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@typing-adventure/db'
import { requireAdmin } from '@/lib/admin-guard'
import { ok, err } from '@/lib/api-response'

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  language: z.string().min(2).max(10).optional(),
  level: z.enum(['easy', 'medium', 'hard']).optional(),
  words: z.array(z.string().min(1).max(50)).min(1).max(500).optional(),
  category: z.string().max(50).optional(),
  isDefault: z.boolean().optional(),
})

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(
  _req: NextRequest,
  context: RouteContext,
) {
  const { id } = await context.params

  try {
    const pack = await prisma.wordPack.findUnique({ where: { id } })
    if (!pack) return err('Word pack not found', 404)
    return ok(pack)
  } catch {
    return err('Failed to fetch word pack', 500)
  }
}

export async function PUT(
  req: NextRequest,
  context: RouteContext,
) {
  const { user, error } = await requireAdmin()
  if (error) return error

  const { id } = await context.params

  try {
    const existing = await prisma.wordPack.findUnique({ where: { id } })
    if (!existing) return err('Word pack not found', 404)

    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return err(parsed.error.errors[0].message)
    }

    const pack = await prisma.wordPack.update({
      where: { id },
      data: parsed.data,
    })

    return ok(pack)
  } catch {
    return err('Failed to update word pack', 500)
  }
}

export async function DELETE(
  _req: NextRequest,
  context: RouteContext,
) {
  const { user, error } = await requireAdmin()
  if (error) return error

  const { id } = await context.params

  try {
    const existing = await prisma.wordPack.findUnique({ where: { id } })
    if (!existing) return err('Word pack not found', 404)

    await prisma.wordPack.delete({ where: { id } })
    return ok({ deleted: true })
  } catch {
    return err('Failed to delete word pack', 500)
  }
}
