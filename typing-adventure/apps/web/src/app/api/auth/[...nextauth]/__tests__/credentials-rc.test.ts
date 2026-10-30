import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const handlerPost = vi.fn(async (req: Request) => {
  const form = await req.formData()
  return Response.json({ email: form.get('email'), password: form.get('password') })
})

vi.mock('@/lib/auth', () => ({
  handlers: { GET: vi.fn(), POST: (req: Request) => handlerPost(req) },
}))

vi.mock('@typing-adventure/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(async () => null),
      create: vi.fn(async ({ data }: { data: { name: string; email: string } }) => ({
        id: 'u1',
        name: data.name,
        email: data.email,
        avatar: 'a',
        createdAt: new Date(0),
      })),
    },
  },
}))

vi.mock('bcryptjs', () => ({ default: { hash: vi.fn(async () => 'hashed') } }))

type Route = typeof import('../route')
let route: Route

const CALLBACK = 'http://localhost/api/auth/callback/credentials'

function login(email: string, headers: Record<string, string> = {}) {
  const body = new URLSearchParams()
  body.set('email', email)
  body.set('password', 'pw-123')
  return new NextRequest(CALLBACK, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', ...headers },
    body: body.toString(),
  })
}

function register() {
  return new NextRequest('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Ana', email: 'ana@x.io', password: 'pw-123456' }),
  })
}

let warn: ReturnType<typeof vi.spyOn>

beforeEach(async () => {
  vi.resetModules()
  vi.unstubAllEnvs()
  handlerPost.mockClear()
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  route = await import('../route')
})

afterEach(() => {
  warn.mockRestore()
  vi.unstubAllEnvs()
})

describe('POST /api/auth/callback/credentials proxy warning', () => {
  it('RC-01: warns exactly once across 3 requests in production without TRUST_PROXY_HEADER', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    for (let i = 0; i < 3; i++) await route.POST(login(`ana${i}@x.io`))
    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0][0])).toContain('TRUST_PROXY_HEADER')
  })

  it('RC-01: an invalid TRUST_PROXY_HEADER in production warns exactly once', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('TRUST_PROXY_HEADER', 'x-client-ip')
    for (let i = 0; i < 3; i++) await route.POST(login('ana@x.io'))
    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0][0])).toContain('TRUST_PROXY_HEADER')
  })

  it('RC-02: does not warn in production when TRUST_PROXY_HEADER is x-real-ip', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('TRUST_PROXY_HEADER', 'x-real-ip')
    for (let i = 0; i < 3; i++) await route.POST(login('ana@x.io', { 'x-real-ip': '203.0.113.7' }))
    expect(warn).not.toHaveBeenCalled()
  })

  it('RC-02: does not warn in production when TRUST_PROXY_HEADER is x-forwarded-for', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('TRUST_PROXY_HEADER', 'x-forwarded-for')
    for (let i = 0; i < 3; i++)
      await route.POST(login('ana@x.io', { 'x-forwarded-for': '203.0.113.7' }))
    expect(warn).not.toHaveBeenCalled()
  })

  it('RC-02: does not warn outside production without TRUST_PROXY_HEADER', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('TRUST_PROXY_HEADER', '')
    for (let i = 0; i < 3; i++) await route.POST(login('ana@x.io'))
    expect(warn).not.toHaveBeenCalled()
  })

  it('RC-03: credentials then register in one process warn exactly once in total, from credentials', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const registerRoute = await import('../../register/route')
    await route.POST(login('ana@x.io'))
    expect(warn).toHaveBeenCalledTimes(1)
    await registerRoute.POST(register())
    await route.POST(login('bob@x.io'))
    await registerRoute.POST(register())
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('RC-03: register then credentials in one process warn exactly once in total', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const registerRoute = await import('../../register/route')
    await registerRoute.POST(register())
    await route.POST(login('ana@x.io'))
    await route.POST(login('bob@x.io'))
    expect(warn).toHaveBeenCalledTimes(1)
  })
})

describe('POST /api/auth/callback/credentials email key cap', () => {
  const grown = 'a'.repeat(200) + 'İ'.repeat(54)
  const sibling = 'a'.repeat(200) + 'İ'.repeat(27) + 'b'.repeat(27)

  it('RC-05: an email of 254 characters after trim that grows past 254 when lowercased is not rejected', async () => {
    expect(grown.length).toBe(254)
    expect(grown.toLowerCase().length).toBe(308)
    const res = await route.POST(login(`  ${grown}  `))
    expect(res.status).toBe(200)
    expect(handlerPost).toHaveBeenCalledTimes(1)
    expect(await res.json()).toEqual({ email: `  ${grown}  `, password: 'pw-123' })
  })

  it('RC-05: two emails sharing the first 254 normalized characters share one bucket', async () => {
    vi.stubEnv('TRUST_PROXY_HEADER', 'x-real-ip')
    const ip = { 'x-real-ip': '203.0.113.30' }
    expect(sibling.length).toBe(254)
    expect(sibling.toLowerCase().slice(0, 254)).toBe(grown.toLowerCase().slice(0, 254))
    const statuses: number[] = []
    for (let i = 0; i < 10; i++)
      statuses.push((await route.POST(login(i % 2 ? sibling : grown, ip))).status)
    expect(statuses).toEqual(Array(10).fill(200))
    expect(handlerPost).toHaveBeenCalledTimes(10)
    expect((await route.POST(login(sibling, ip))).status).toBe(429)
    expect(handlerPost).toHaveBeenCalledTimes(10)
  })

  it('RC-05: the shared bucket is per IP', async () => {
    vi.stubEnv('TRUST_PROXY_HEADER', 'x-real-ip')
    for (let i = 0; i < 10; i++) await route.POST(login(grown, { 'x-real-ip': '203.0.113.31' }))
    expect((await route.POST(login(sibling, { 'x-real-ip': '203.0.113.31' }))).status).toBe(429)
    expect((await route.POST(login(sibling, { 'x-real-ip': '203.0.113.32' }))).status).toBe(200)
  })
})
