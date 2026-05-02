import { prisma } from '@typing-adventure/db'
import { requireAdmin } from '@/lib/admin-guard'
import { ok, err } from '@/lib/api-response'
import { z } from 'zod'

const assignmentSchema = z.object({
  title: z.string().min(1).max(200),
  gameMode: z.string().min(1),
  level: z.string().min(1),
  deadline: z.string().optional(),
})

export async function POST(
  request: Request,
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

    const body = await request.json()
    const parsed = assignmentSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.issues[0].message)

    const assignment = await prisma.assignment.create({
      data: {
        classroomId: id,
        createdById: user!.id,
        title: parsed.data.title,
        gameMode: parsed.data.gameMode,
        level: parsed.data.level,
        deadline: parsed.data.deadline
          ? new Date(parsed.data.deadline)
          : undefined,
      },
    })

    return ok({
      id: assignment.id,
      title: assignment.title,
      gameMode: assignment.gameMode,
      level: assignment.level,
      deadline: assignment.deadline,
    })
  } catch {
    return err('Failed to create assignment', 500)
  }
}
