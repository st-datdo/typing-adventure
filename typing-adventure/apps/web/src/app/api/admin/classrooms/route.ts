import { prisma } from '@typing-adventure/db'
import { requireAdmin } from '@/lib/admin-guard'
import { ok, err } from '@/lib/api-response'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
})

export async function GET() {
  const { user, error } = await requireAdmin()
  if (error) return error

  try {
    const classrooms = await prisma.classroom.findMany({
      where: { teacherId: user!.id },
      include: {
        _count: { select: { members: true, assignments: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return ok(
      classrooms.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        inviteCode: c.inviteCode,
        studentCount: c._count.members,
        assignmentCount: c._count.assignments,
        createdAt: c.createdAt,
      })),
    )
  } catch {
    return err('Failed to fetch classrooms', 500)
  }
}

export async function POST(request: Request) {
  const { user, error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.issues[0].message)

    const classroom = await prisma.classroom.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        teacherId: user!.id,
      },
    })

    return ok({
      id: classroom.id,
      name: classroom.name,
      description: classroom.description,
      inviteCode: classroom.inviteCode,
    })
  } catch {
    return err('Failed to create classroom', 500)
  }
}
