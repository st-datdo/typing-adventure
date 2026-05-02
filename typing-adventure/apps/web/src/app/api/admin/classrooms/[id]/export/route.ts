import { prisma } from '@typing-adventure/db'
import { requireAdmin } from '@/lib/admin-guard'
import { err } from '@/lib/api-response'

function csvEscape(value: string): string {
  // Prevent CSV formula injection
  if (/^[=+\-@\t\r]/.test(value)) return `'${value}`
  // Quote values containing commas or quotes
  if (value.includes(',') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w\s-]/g, '_').slice(0, 100)
}

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
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    })

    if (!classroom) return err('Classroom not found', 404)

    // Batch query: all records at once
    const userIds = classroom.members.map((m) => m.userId)
    const records = await prisma.userRecord.findMany({
      where: { userId: { in: userIds } },
    })
    const recordMap = new Map(records.map((r) => [r.userId, r]))

    const rows: string[] = [
      'Name,Email,Total Games,Best WPM (Easy),Best WPM (Medium),Best WPM (Hard),Day Streak,Last Played',
    ]

    for (const member of classroom.members) {
      const record = recordMap.get(member.userId)
      const bestWpm = (record?.bestWpm ?? {
        easy: 0,
        medium: 0,
        hard: 0,
      }) as Record<string, number>

      const name = csvEscape(member.user.name ?? 'Unknown')
      const email = csvEscape(member.user.email)
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
    const safeName = sanitizeFilename(classroom.name)

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${safeName}-report.csv"`,
      },
    })
  } catch {
    return err('Failed to export report', 500)
  }
}
