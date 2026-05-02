import { prisma } from '@typing-adventure/db'
import { requireAdmin } from '@/lib/admin-guard'
import { ok, err } from '@/lib/api-response'

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

    // Fetch stats for each student
    const studentStats = await Promise.all(
      classroom.members.map(async (member) => {
        const [record, recentSessions] = await Promise.all([
          prisma.userRecord.findUnique({
            where: { userId: member.userId },
          }),
          prisma.gameSession.findMany({
            where: { userId: member.userId },
            orderBy: { createdAt: 'desc' },
            take: 20,
            select: {
              wpm: true,
              accuracy: true,
              createdAt: true,
            },
          }),
        ])

        return {
          userId: member.userId,
          name: member.user.name,
          email: member.user.email,
          avatar: member.user.avatar,
          joinedAt: member.joinedAt,
          totalGames: record?.totalGames ?? 0,
          bestWpm: record?.bestWpm ?? { easy: 0, medium: 0, hard: 0 },
          lastPlayDate: record?.lastPlayDate,
          recentSessions: recentSessions.map((s) => ({
            wpm: s.wpm,
            accuracy: s.accuracy,
            date: s.createdAt,
          })),
        }
      }),
    )

    // Class aggregate stats
    const allStudentIds = classroom.members.map((m) => m.userId)
    const classStats =
      allStudentIds.length > 0
        ? await prisma.gameSession.aggregate({
            _avg: { wpm: true, accuracy: true },
            where: { userId: { in: allStudentIds } },
          })
        : { _avg: { wpm: null, accuracy: null } }

    // Most common mistakes across class
    const classSessions =
      allStudentIds.length > 0
        ? await prisma.gameSession.findMany({
            where: { userId: { in: allStudentIds } },
            select: { mistakeMap: true },
            take: 200,
            orderBy: { createdAt: 'desc' },
          })
        : []

    const mistakeAggregate: Record<string, number> = {}
    for (const s of classSessions) {
      const map = s.mistakeMap as Record<string, number>
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
