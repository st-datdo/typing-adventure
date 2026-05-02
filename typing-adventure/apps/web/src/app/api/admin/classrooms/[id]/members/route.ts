import { prisma } from '@typing-adventure/db'
import { requireAdmin } from '@/lib/admin-guard'
import { ok, err } from '@/lib/api-response'
import { z } from 'zod'

const addMemberSchema = z.object({
  email: z.string().email(),
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
    const parsed = addMemberSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.issues[0].message)

    const student = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true, name: true, email: true, avatar: true },
    })

    if (!student) return err('User not found with that email', 404)

    // Check if already a member
    const existing = await prisma.classroomMember.findUnique({
      where: { classroomId_userId: { classroomId: id, userId: student.id } },
    })
    if (existing) return err('Student is already in this classroom')

    await prisma.classroomMember.create({
      data: { classroomId: id, userId: student.id },
    })

    return ok(student)
  } catch {
    return err('Failed to add member', 500)
  }
}

export async function DELETE(
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

    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    if (!userId) return err('userId is required')

    await prisma.classroomMember.delete({
      where: { classroomId_userId: { classroomId: id, userId } },
    })

    return ok({ removed: true })
  } catch (e: unknown) {
    if (
      e instanceof Error &&
      'code' in e &&
      (e as { code: string }).code === 'P2025'
    ) {
      return err('Student not found in this classroom', 404)
    }
    return err('Failed to remove member', 500)
  }
}
