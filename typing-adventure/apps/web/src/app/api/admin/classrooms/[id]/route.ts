import { prisma } from '@typing-adventure/db'
import { requireAdmin } from '@/lib/admin-guard'
import { ok, err } from '@/lib/api-response'
import { safeMistakeMap } from '@/lib/mistake-map'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireAdmin()
  if (error) return error

  const { id } = await params

  try {
    const classroom = await prisma.classroom.findFirst({
      where: { id, teacherId: user!.id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        assignments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!classroom) return err('Classroom not found', 404)

    const allStudentIds = classroom.members.map((m) => m.userId)

    // Batch queries: records + recent sessions for ALL students at once
    const [records, allRecentSessions, classStats, classSessions] =
      allStudentIds.length > 0
        ? await Promise.all([
            prisma.userRecord.findMany({
              where: { userId: { in: allStudentIds } },
            }),
            prisma.gameSession.findMany({
              where: { userId: { in: allStudentIds } },
              orderBy: { createdAt: 'desc' },
              take: allStudentIds.length * 20,
              select: {
                userId: true,
                wpm: true,
                accuracy: true,
                createdAt: true,
              },
            }),
            prisma.gameSession.aggregate({
              _avg: { wpm: true, accuracy: true },
              where: {
                userId: { in: allStudentIds },
                createdAt: { gte: new Date(Date.now() - 30 * 86400000) },
              },
            }),
            prisma.gameSession.findMany({
              where: { userId: { in: allStudentIds } },
              select: { mistakeMap: true },
              take: 500,
              orderBy: { createdAt: 'desc' },
            }),
          ])
        : [[], [], { _avg: { wpm: null, accuracy: null } }, []]

    // Index records by userId
    const recordMap = new Map(records.map((r) => [r.userId, r]))

    // Group recent sessions by userId, limit 20 per student
    const sessionsByUser = new Map<
      string,
      { wpm: number; accuracy: number; date: Date }[]
    >()
    for (const s of allRecentSessions) {
      const list = sessionsByUser.get(s.userId) ?? []
      if (list.length < 20) {
        list.push({ wpm: s.wpm, accuracy: s.accuracy, date: s.createdAt })
      }
      sessionsByUser.set(s.userId, list)
    }

    const studentStats = classroom.members.map((member) => {
      const record = recordMap.get(member.userId)
      return {
        userId: member.userId,
        name: member.user.name,
        email: member.user.email,
        avatar: member.user.avatar,
        joinedAt: member.joinedAt,
        totalGames: record?.totalGames ?? 0,
        bestWpm: record?.bestWpm ?? { easy: 0, medium: 0, hard: 0 },
        lastPlayDate: record?.lastPlayDate,
        recentSessions: sessionsByUser.get(member.userId) ?? [],
      }
    })

    // Aggregate mistakes with safe parsing
    const mistakeAggregate: Record<string, number> = {}
    for (const s of classSessions) {
      const map = safeMistakeMap(s.mistakeMap)
      for (const [key, count] of Object.entries(map)) {
        mistakeAggregate[key] = (mistakeAggregate[key] ?? 0) + count
      }
    }

    const topMistakes = Object.entries(mistakeAggregate)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([char, count]) => ({ char, count }))

    return ok({
      id: classroom.id,
      name: classroom.name,
      description: classroom.description,
      inviteCode: classroom.inviteCode,
      students: studentStats,
      assignments: classroom.assignments.map((a) => ({
        id: a.id,
        title: a.title,
        gameMode: a.gameMode,
        level: a.level,
        deadline: a.deadline,
        createdAt: a.createdAt,
      })),
      classStats: {
        avgWpm: Math.round(classStats._avg.wpm ?? 0),
        avgAccuracy: Math.round(classStats._avg.accuracy ?? 0),
        topMistakes,
      },
    })
  } catch {
    return err('Failed to fetch classroom details', 500)
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireAdmin()
  if (error) return error

  const { id } = await params

  try {
    const classroom = await prisma.classroom.findFirst({
      where: { id, teacherId: user!.id },
    })

    if (!classroom) return err('Classroom not found', 404)

    await prisma.classroom.delete({ where: { id } })
    return ok({ deleted: true })
  } catch {
    return err('Failed to delete classroom', 500)
  }
}
