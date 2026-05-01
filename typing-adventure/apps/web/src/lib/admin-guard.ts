import { prisma } from '@typing-adventure/db'
import { getSessionUser } from '@/lib/auth'
import { err, unauthorized } from '@/lib/api-response'

export async function requireAdmin() {
  const sessionUser = await getSessionUser()
  if (!sessionUser) return { user: null, error: unauthorized() }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, role: true },
  })

  if (!user || user.role !== 'ADMIN') {
    return { user: null, error: err('Forbidden: admin only', 403) }
  }

  return { user, error: null }
}
