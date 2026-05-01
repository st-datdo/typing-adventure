import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@typing-adventure/db'
import { requireAdmin } from '@/lib/admin-guard'
import { ok, err } from '@/lib/api-response'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const url = new URL(req.url)
  const raw = Object.fromEntries(url.searchParams)
  const parsed = querySchema.safeParse(raw)
  if (!parsed.success) {
    return err(parsed.error.errors[0].message)
  }

  const { page, limit, search } = parsed.data
  const offset = (page - 1) * limit

  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  }

  try {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: where as any,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          role: true,
          createdAt: true,
          records: {
            select: {
              bestWpm: true,
              totalGames: true,
            },
          },
        },
      }),
      prisma.user.count({ where: where as any }),
    ])

    return ok(users, { total, page, limit })
  } catch {
    return err('Failed to fetch users', 500)
  }
}
