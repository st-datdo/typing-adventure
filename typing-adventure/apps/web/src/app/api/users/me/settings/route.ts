import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@typing-adventure/db'
import { getSessionUser } from '@/lib/auth'
import { ok, err, unauthorized } from '@/lib/api-response'

const settingsSchema = z.object({
  theme: z.enum(['dark', 'light', 'colorful']).optional(),
  keyboardCase: z.enum(['lower', 'upper']).optional(),
  soundMode: z.enum(['default', 'character', 'word']).optional(),
  soundEnabled: z.boolean().optional(),
  speechRate: z.enum(['slow', 'normal', 'fast']).optional(),
  wordCount: z.number().int().min(3).max(50).optional(),
  fingerGuide: z.boolean().optional(),
  lang: z.enum(['vi', 'en']).optional(),
}).passthrough()

export async function PUT(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return unauthorized()

  try {
    const body = await req.json()
    const parsed = settingsSchema.safeParse(body)
    if (!parsed.success) {
      return err(parsed.error.errors[0].message)
    }

    const current = await prisma.user.findUnique({
      where: { id: user.id },
      select: { settings: true },
    })

    const merged = { ...(current?.settings as Record<string, unknown> ?? {}), ...parsed.data }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { settings: merged as any },
      select: { settings: true },
    })

    return ok(updated.settings)
  } catch {
    return err('Failed to update settings', 500)
  }
}
