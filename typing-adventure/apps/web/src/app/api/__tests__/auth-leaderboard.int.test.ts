import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { prisma } from '@typing-adventure/db'
import { POST as register } from '@/app/api/auth/register/route'
import { GET as leaderboard } from '@/app/api/leaderboard/route'

const runId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
const email = (name: string) => `it-${runId}-${name}@int.test`
let ip = 0

function registerRequest(body: unknown) {
  ip += 1
  return new NextRequest('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-real-ip': `203.0.113.${ip}` },
    body: JSON.stringify(body),
  })
}

async function cleanup() {
  await prisma.user.deleteMany({ where: { email: { endsWith: '@int.test' } } })
}

beforeAll(cleanup)

afterAll(async () => {
  await cleanup()
  await prisma.$disconnect()
})

describe('integration: database isolation', () => {
  it('runs against the worktree schema, not public', async () => {
    const rows = await prisma.$queryRaw<{ schema: string }[]>`select current_schema() as schema`
    expect(rows[0].schema).toMatch(/^wt_[a-z0-9_]+$/)
  })
})

describe('integration: POST /api/auth/register', () => {
  it('creates a user and returns the success envelope', async () => {
    const res = await register(
      registerRequest({ name: 'Ana', email: email('ok'), password: 'secret123' }),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.email).toBe(email('ok'))
    expect(body.data).not.toHaveProperty('passwordHash')
    const stored = await prisma.user.findUnique({
      where: { email: email('ok') },
      include: { records: true },
    })
    expect(stored?.passwordHash).not.toBe('secret123')
    expect(stored?.records).not.toBeNull()
  })

  it('returns 409 for a duplicate email', async () => {
    await prisma.user.create({ data: { name: 'Dup', email: email('dup'), passwordHash: 'x' } })
    const res = await register(
      registerRequest({ name: 'Dup', email: email('dup'), password: 'secret123' }),
    )
    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({ success: false, error: 'Email already registered' })
  })

  it('returns 400 for an invalid body', async () => {
    const res = await register(registerRequest({ name: '', email: 'not-an-email', password: '1' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(typeof body.error).toBe('string')
    expect(await prisma.user.count({ where: { email: 'not-an-email' } })).toBe(0)
  })
})

describe('integration: GET /api/leaderboard', () => {
  it('returns the envelope with sessions created by the test', async () => {
    const user = await prisma.user.create({
      data: { name: 'Leader', email: email('lb'), passwordHash: 'x' },
    })
    await prisma.gameSession.createMany({
      data: [900001, 900002].map((score) => ({
        userId: user.id,
        gameMode: 'timeAttack',
        level: 'hard',
        wpm: 42,
        cps: 3.5,
        accuracy: 97,
        score,
        stars: 3,
        timeSeconds: 60,
        wordCount: 42,
      })),
    })

    const res = await leaderboard(
      new NextRequest('http://localhost/api/leaderboard?mode=timeAttack&level=hard&limit=100'),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.meta.limit).toBe(100)
    const mine = body.data.filter((row: { userId: string }) => row.userId === user.id)
    expect(mine).toHaveLength(1)
    expect(mine[0]).toMatchObject({ name: 'Lea***', score: 900002, wpm: 42 })
  })

  it('returns 400 for an unknown mode', async () => {
    const res = await leaderboard(new NextRequest('http://localhost/api/leaderboard?mode=nope'))
    expect(res.status).toBe(400)
    expect((await res.json()).success).toBe(false)
  })
})
