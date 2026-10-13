import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma, Prisma } from '@typing-adventure/db'
import { getSessionUser } from '@/lib/auth'
import { requireAdmin } from '@/lib/admin-guard'
import { ok, err, unauthorized } from '@/lib/api-response'

const querySchema = z.object({
  language: z.string().optional(),
  level: z.enum(['easy', 'medium', 'hard']).optional(),
  category: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  language: z.string().min(2).max(10).default('en'),
  level: z.enum(['easy', 'medium', 'hard']),
  words: z.array(z.string().min(1).max(50)).min(1).max(500),
  category: z.string().max(50).optional(),
  isDefault: z.boolean().default(false),
})

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const raw = Object.fromEntries(url.searchParams)
  const parsed = querySchema.safeParse(raw)
  if (!parsed.success) {
    return err(parsed.error.errors[0].message)
  }

  const { language, level, category, page, limit } = parsed.data
  const offset = (page - 1) * limit

  const where: Prisma.WordPackWhereInput = {}
  if (language) where.language = language
  if (level) where.level = level
  if (category) where.category = category

  try {
    const [packs, total] = await Promise.all([
      prisma.wordPack.findMany({
        where,
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        skip: offset,
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          language: true,
          level: true,
          category: true,
          isDefault: true,
          createdAt: true,
          words: true,
        },
      }),
      prisma.wordPack.count({ where }),
    ])

    const data = packs.map((p) => ({
      ...p,
      wordCount: p.words.length,
    }))

    return ok(data, { total, page, limit })
  } catch {
    return err('Failed to fetch word packs', 500)
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAdmin()
  if (error) return error

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return err(parsed.error.errors[0].message)
    }

    const data = parsed.data
    const pack = await prisma.wordPack.create({
      data: {
        name: data.name,
        description: data.description,
        language: data.language,
        level: data.level,
        words: data.words,
        category: data.category,
        isDefault: data.isDefault,
        createdBy: user!.id,
      },
    })

    return ok(pack)
  } catch {
    return err('Failed to create word pack', 500)
  }
}
