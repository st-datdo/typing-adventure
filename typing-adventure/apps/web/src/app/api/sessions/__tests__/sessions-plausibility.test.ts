import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const gameSessionCreate = vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
  id: 's1',
  ...data,
}))
const userRecordFindUnique = vi.fn(async () => null)
const userRecordUpsert = vi.fn(async () => ({ userId: 'u1' }))

vi.mock('@typing-adventure/db', () => ({
  prisma: {
    gameSession: { create: (args: never) => gameSessionCreate(args) },
    userRecord: {
      findUnique: () => userRecordFindUnique(),
      upsert: () => userRecordUpsert(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  getSessionUser: vi.fn(async () => ({ id: 'u1', email: 'u1@x.io', name: 'U1' })),
}))

type Route = typeof import('../route')
let route: Route

const VALID = {
  gameMode: 'classic',
  level: 'easy',
  wpm: 60,
  cps: 5,
  accuracy: 100,
  score: 3672,
  stars: 3,
  timeSeconds: 10,
  wordCount: 10,
  maxCombo: 51,
  mistakeMap: {},
}

function post(body: unknown) {
  return new NextRequest('http://localhost/api/sessions', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(async () => {
  vi.resetModules()
  gameSessionCreate.mockClear()
  userRecordFindUnique.mockClear()
  userRecordUpsert.mockClear()
  route = await import('../route')
})

describe('POST /api/sessions plausibility', () => {
  it.each([
    ['SP-01 wpm above 200', { wpm: 245, cps: 20.42, maxCombo: 40, score: 1000 }],
    ['SP-02 wpm disagrees with cps', { wpm: 150 }],
    ['SP-03 maxCombo above nMax', { maxCombo: 52 }],
    ['SP-04 score above scoreMax', { score: 3673 }],
    ['SP-04 forged leaderboard score', { score: 99_999_999 }],
  ])('SP-06: %s -> 400 and nothing is written', async (_name, over) => {
    const res = await route.POST(post({ ...VALID, ...over }))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ success: false, error: 'Implausible session result' })
    expect(gameSessionCreate).not.toHaveBeenCalled()
    expect(userRecordUpsert).not.toHaveBeenCalled()
  })

  it('SP-07: a plausible result is saved once with its wpm and score', async () => {
    const res = await route.POST(post(VALID))
    expect(res.status).toBe(200)
    expect((await res.json()).success).toBe(true)
    expect(gameSessionCreate).toHaveBeenCalledTimes(1)
    expect(gameSessionCreate.mock.calls[0][0].data).toMatchObject({
      wpm: 60,
      score: 3672,
      userId: 'u1',
    })
    expect(userRecordUpsert).toHaveBeenCalledTimes(1)
  })

  it('SP-07: an older Zod rule still answers with its own message', async () => {
    const res = await route.POST(post({ ...VALID, accuracy: 101 }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).not.toBe('Implausible session result')
    expect(gameSessionCreate).not.toHaveBeenCalled()
  })
})
