import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma, Prisma } from '@typing-adventure/db'
import { mergeChildProgress, normalizeChildProgress, PET_KINDS } from '@typing-adventure/game-engine'
import { getSessionUser } from '@/lib/auth'
import { ok, err, unauthorized } from '@/lib/api-response'

const count = z.number().int().min(0).max(1_000_000)
const day = z.string().max(10)
const gameMap = z.object({ balloon: count.optional(), picture: count.optional() })

const childProgressSchema = z.object({
  little: z.object({
    progress: z.record(z.string().regex(/^[a-z]$/), z.object({ seen: count, firstTry: count })),
    stickers: z.array(z.string().min(1).max(16)).max(2000),
    daily: z.object({ date: day, sessions: count, bonus: count }),
    dailyLimit: z.number().int().min(0).max(100),
    pet: z.object({
      kind: z.enum(PET_KINDS as [string, ...string[]]).nullable(),
      days: count,
      lastDay: day,
    }),
  }),
  games: z.object({ best: gameMap, plays: gameMap }),
  updatedAt: z.number().min(0),
})

const putSchema = z.object({
  data: childProgressSchema,
  replace: z.boolean().optional(),
})

export async function GET() {
  const user = await getSessionUser()
  if (!user) return unauthorized()

  try {
    const row = await prisma.childProgress.findUnique({
      where: { userId: user.id },
      select: { data: true },
    })
    return ok(normalizeChildProgress(row?.data ?? null))
  } catch {
    return err('Failed to fetch progress', 500)
  }
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return unauthorized()

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return err('Invalid JSON')
  }
  const parsed = putSchema.safeParse(body)
  if (!parsed.success) {
    return err(parsed.error.errors[0].message)
  }

  try {
    const incoming = normalizeChildProgress(parsed.data.data)
    const merged = await prisma.$transaction(async (tx) => {
      const row = await tx.childProgress.findUnique({
        where: { userId: user.id },
        select: { data: true },
      })
      const next = parsed.data.replace || !row
        ? incoming
        : mergeChildProgress(normalizeChildProgress(row.data), incoming)
      const data = next as unknown as Prisma.InputJsonObject
      await tx.childProgress.upsert({
        where: { userId: user.id },
        create: { userId: user.id, data },
        update: { data },
      })
      return next
    })
    return ok(merged)
  } catch {
    return err('Failed to save progress', 500)
  }
}
