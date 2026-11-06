import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const findUnique = vi.fn(async () => ({ settings: { theme: 'dark' } }))
const update = vi.fn(async ({ data }: { data: { settings: Record<string, unknown> } }) => ({
  settings: data.settings,
}))
const getSessionUser = vi.fn(async (): Promise<{ id: string } | null> => ({ id: 'u1' }))

vi.mock('@typing-adventure/db', () => ({
  prisma: {
    user: {
      findUnique: () => findUnique(),
      update: (args: never) => update(args),
    },
  },
  Prisma: {},
}))

vi.mock('@/lib/auth', () => ({ getSessionUser: () => getSessionUser() }))

type Route = typeof import('../route')
let route: Route

function put(body: unknown) {
  return new NextRequest('http://localhost/api/users/me/settings', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(async () => {
  vi.resetModules()
  findUnique.mockClear()
  update.mockClear()
  getSessionUser.mockClear()
  getSessionUser.mockImplementation(async () => ({ id: 'u1' }))
  route = await import('../route')
})

describe('PUT /api/users/me/settings effectsLevel', () => {
  it.each(['lots', 'some', 'few'])('FX-14 accepts %s and merges it', async (level) => {
    const res = await route.PUT(put({ effectsLevel: level }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toEqual({ theme: 'dark', effectsLevel: level })
    expect(update).toHaveBeenCalledTimes(1)
    expect(update.mock.calls[0][0].data.settings).toEqual({ theme: 'dark', effectsLevel: level })
  })

  it.each([
    ['max', 'max'],
    ['a number', 3],
    ['a long string', 'x'.repeat(500)],
    ['null', null],
  ])('FX-14 E14 rejects %s with 400 and writes nothing', async (_name, bad) => {
    const res = await route.PUT(put({ effectsLevel: bad }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(typeof body.error).toBe('string')
    expect(update).not.toHaveBeenCalled()
  })

  it('FX-14 401 without a user', async () => {
    getSessionUser.mockImplementation(async () => null)
    const res = await route.PUT(put({ effectsLevel: 'some' }))
    expect(res.status).toBe(401)
    expect(update).not.toHaveBeenCalled()
  })
})
