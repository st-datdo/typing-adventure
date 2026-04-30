import { NextRequest } from 'next/server'
import { prisma } from '@typing-adventure/db'
import { ok, err } from '@/lib/api-response'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const url = new URL(req.url)
  const limit = Math.min(20, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20')))

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!user) return err('User not found', 404)

    const sessions = await prisma.gameSession.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        wpm: true,
        accuracy: true,
        score: true,
        level: true,
        gameMode: true,
        createdAt: true,
      },
    })

    return ok(sessions)
  } catch {
    return err('Failed to fetch user sessions', 500)
  }
}
