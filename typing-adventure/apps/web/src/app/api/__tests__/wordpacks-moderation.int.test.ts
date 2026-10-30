import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { prisma } from '@typing-adventure/db'

const runId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
const adminId = `it-wp-${runId}`

vi.mock('@/lib/admin-guard', () => ({
  requireAdmin: async () => ({ user: { id: adminId, role: 'ADMIN' }, error: null }),
}))

const { POST } = await import('@/app/api/wordpacks/route')
const { PUT } = await import('@/app/api/wordpacks/[id]/route')

function jsonRequest(method: string, url: string, body: unknown) {
  return new NextRequest(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const pack = (words: string[], name = `wp-${runId}`) => ({ name, level: 'easy', words })
const create = (words: string[], name?: string) =>
  POST(jsonRequest('POST', 'http://localhost/api/wordpacks', pack(words, name)))
const update = (id: string, body: unknown) =>
  PUT(jsonRequest('PUT', `http://localhost/api/wordpacks/${id}`, body), {
    params: Promise.resolve({ id }),
  })
const mine = () => prisma.wordPack.findMany({ where: { createdBy: adminId } })

async function cleanup() {
  await prisma.wordPack.deleteMany({ where: { createdBy: adminId } })
}

beforeAll(cleanup)

afterAll(async () => {
  await cleanup()
  await prisma.$disconnect()
})

describe('integration: word pack moderation', () => {
  it('runs against the worktree schema, not public', async () => {
    const rows = await prisma.$queryRaw<{ schema: string }[]>`select current_schema() as schema`
    expect(rows[0].schema).toMatch(/^wt_[a-z0-9_]+$/)
  })

  it('WP-05: POST with blocked or invalid words returns 400 with the count and writes nothing', async () => {
    const res = await create(['cat', 'Stupid', 'dog1', 'cat'], `wp-${runId}-bad`)
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      success: false,
      error: '2 word(s) rejected by moderation',
    })
    expect(await prisma.wordPack.count({ where: { name: `wp-${runId}-bad` } })).toBe(0)
  })

  it('WP-06: POST stores normalized, deduplicated words in input order', async () => {
    const res = await create(['  cat ', 'ice   cream', 'Cat', 'dog'])
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.words).toEqual(['cat', 'ice cream', 'dog'])
    const stored = await prisma.wordPack.findUnique({ where: { id: body.data.id } })
    expect(stored?.words).toEqual(['cat', 'ice cream', 'dog'])
  })

  it('WP-07: PUT with a blocked word returns 400 and keeps the stored words', async () => {
    const created = await prisma.wordPack.create({
      data: { name: `wp-${runId}-put`, level: 'easy', words: ['sun', 'moon'], createdBy: adminId },
    })
    const res = await update(created.id, { words: ['star', 'IDIOT'] })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      success: false,
      error: '1 word(s) rejected by moderation',
    })
    const stored = await prisma.wordPack.findUnique({ where: { id: created.id } })
    expect(stored?.words).toEqual(['sun', 'moon'])
  })

  it('WP-07: PUT with valid words stores the accepted list', async () => {
    const created = await prisma.wordPack.create({
      data: { name: `wp-${runId}-put2`, level: 'easy', words: ['sun'], createdBy: adminId },
    })
    const res = await update(created.id, { words: [' star ', 'STAR', 'sky  blue'] })
    expect(res.status).toBe(200)
    const stored = await prisma.wordPack.findUnique({ where: { id: created.id } })
    expect(stored?.words).toEqual(['star', 'sky blue'])
  })

  it('WP-07: PUT without words updates other fields as before', async () => {
    const created = await prisma.wordPack.create({
      data: { name: `wp-${runId}-put3`, level: 'easy', words: ['sun'], createdBy: adminId },
    })
    const res = await update(created.id, { level: 'hard' })
    expect(res.status).toBe(200)
    const stored = await prisma.wordPack.findUnique({ where: { id: created.id } })
    expect(stored).toMatchObject({ level: 'hard', words: ['sun'] })
    expect((await mine()).length).toBeGreaterThanOrEqual(3)
  })
})
