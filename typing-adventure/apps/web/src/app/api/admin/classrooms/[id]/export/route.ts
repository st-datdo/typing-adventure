import { prisma } from '@typing-adventure/db'
import { requireAdmin } from '@/lib/admin-guard'
import { err } from '@/lib/api-response'

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
              select: { name: true, email: true },
            },
          },
        },
      },
    })

    if (!classroom) return err('Classroom not found', 404)

    // Get stats for each student
    const rows: string[] = [
      'Name,Email,Total Games,Best WPM (Easy),Best WPM (Medium),Best WPM (Hard),Day Streak,Last Played',
    ]

    for (const member of classroom.members) {
      const record = await prisma.userRecord.findUnique({
        where: { userId: member.userId },
      })

      const bestWpm = (record?.bestWpm ?? {
        easy: 0,
        medium: 0,
        hard: 0,
      }) as Record<string, number>

      const name = (member.user.name ?? '').replace(/,/g, ' ')
      const email = member.user.email
      const totalGames = record?.totalGames ?? 0
      const streak = record?.dayStreak ?? 0
      const lastPlayed = record?.lastPlayDate
        ? record.lastPlayDate.toISOString().slice(0, 10)
        : 'Never'

      rows.push(
        `${name},${email},${totalGames},${bestWpm.easy ?? 0},${bestWpm.medium ?? 0},${bestWpm.hard ?? 0},${streak},${lastPlayed}`,
      )
    }

    const csv = rows.join('\n')

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${classroom.name}-report.csv"`,
      },
    })
  } catch {
    return err('Failed to export report', 500)
  }
}
