import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const handlerPost = vi.fn(async (req: Request) => {
  if (req.headers.get('content-type')?.includes('application/json')) {
    const body = await req.json().catch(() => ({}))
    return Response.json({ email: body.email, password: body.password })
  }
  const form = await req.formData()
  return Response.json({ email: form.get('email'), password: form.get('password') })
})

vi.mock('@/lib/auth', () => ({
  handlers: { GET: vi.fn(), POST: (req: Request) => handlerPost(req) },
}))

type Route = typeof import('../route')
let route: Route

const CALLBACK = 'http://localhost/api/auth/callback/credentials'

function login(email: string | null, headers: Record<string, string> = {}, url = CALLBACK) {
  const body = new URLSearchParams()
  if (email !== null) body.set('email', email)
  body.set('password', 'pw-123')
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', ...headers },
    body: body.toString(),
  })
}

async function attempts(n: number, make: (i: number) => NextRequest) {
  const statuses: number[] = []
  for (let i = 0; i < n; i++) statuses.push((await route.POST(make(i))).status)
  return statuses
}

beforeEach(async () => {
  vi.resetModules()
  vi.unstubAllEnvs()
  handlerPost.mockClear()
  route = await import('../route')
})

describe('POST /api/auth/callback/credentials limiter', () => {
  it('RL-04: allows 10 attempts per IP + email and answers the 11th with 429 and the login redirect', async () => {
    vi.stubEnv('TRUST_PROXY_HEADER', 'x-real-ip')
    const ip = { 'x-real-ip': '203.0.113.7' }
    const statuses = await attempts(10, () => login('ana@x.io', ip))
    expect(statuses).toEqual(Array(10).fill(200))
    const blocked = await route.POST(login('ana@x.io', ip))
    expect(blocked.status).toBe(429)
    expect(blocked.headers.get('Retry-After')).toBeTruthy()
    expect(await blocked.json()).toEqual({
      success: false,
      error: 'Too many requests',
      url: 'http://localhost/login?error=RateLimited',
    })
  })

  it('RL-04: a second email from the same IP is not blocked by the first', async () => {
    vi.stubEnv('TRUST_PROXY_HEADER', 'x-real-ip')
    const ip = { 'x-real-ip': '203.0.113.7' }
    await attempts(11, () => login('ana@x.io', ip))
    expect((await route.POST(login('bob@x.io', ip))).status).toBe(200)
  })

  it('RL-04: email is trimmed and lowercased before keying', async () => {
    vi.stubEnv('TRUST_PROXY_HEADER', 'x-real-ip')
    const ip = { 'x-real-ip': '203.0.113.7' }
    await attempts(10, (i) => login(i % 2 ? ' Ana@X.io ' : 'ana@x.io', ip))
    expect((await route.POST(login('ANA@x.IO', ip))).status).toBe(429)
  })

  it('RL-04: the same email from another IP has its own budget', async () => {
    vi.stubEnv('TRUST_PROXY_HEADER', 'x-real-ip')
    await attempts(11, () => login('ana@x.io', { 'x-real-ip': '203.0.113.7' }))
    expect((await route.POST(login('ana@x.io', { 'x-real-ip': '203.0.113.8' }))).status).toBe(200)
  })

  it('RL-05: a known IP is capped at 30 attempts across emails', async () => {
    vi.stubEnv('TRUST_PROXY_HEADER', 'x-forwarded-for')
    const ip = { 'x-forwarded-for': '203.0.113.9' }
    const statuses = await attempts(30, (i) => login(`user${i}@x.io`, ip))
    expect(statuses).toEqual(Array(30).fill(200))
    expect((await route.POST(login('fresh@x.io', ip))).status).toBe(429)
    expect(
      (await route.POST(login('fresh@x.io', { 'x-forwarded-for': '203.0.113.10' }))).status,
    ).toBe(200)
  })

  it('RL-06: an unknown IP skips the per-IP cap', async () => {
    const statuses = await attempts(35, (i) =>
      login(`kid${i}@school.io`, { 'x-real-ip': '203.0.113.7' }),
    )
    expect(statuses).toEqual(Array(35).fill(200))
    expect(handlerPost).toHaveBeenCalledTimes(35)
  })

  it('RL-06: an unknown IP still limits each email', async () => {
    await attempts(10, () => login('ana@x.io'))
    expect((await route.POST(login('ana@x.io'))).status).toBe(429)
  })

  it('RL-07: the handler receives the original form body', async () => {
    const res = await route.POST(login('ana@x.io'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ email: 'ana@x.io', password: 'pw-123' })
  })

  it('RL-07: other auth POST paths are not counted', async () => {
    const signout = 'http://localhost/api/auth/signout'
    const statuses = await attempts(12, () => login('ana@x.io', {}, signout))
    expect(statuses).toEqual(Array(12).fill(200))
    expect((await route.POST(login('ana@x.io'))).status).toBe(200)
  })

  it('RL-04: a request without email is limited under the empty email key', async () => {
    const statuses = await attempts(11, () => login(null))
    expect(statuses.slice(0, 10)).toEqual(Array(10).fill(200))
    expect(statuses[10]).toBe(429)
  })

  it('RL-08: duplicate email fields are rejected with 400 without calling Auth.js', async () => {
    const req = new NextRequest(CALLBACK, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: 'email=random1%40x.io&email=victim%40x.io&password=pw',
    })
    const res = await route.POST(req)
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ success: false, error: 'Invalid credentials request' })
    expect(handlerPost).not.toHaveBeenCalled()
  })

  it('RL-08: rotating a decoy email cannot bypass the per-email limit', async () => {
    const statuses = await attempts(
      12,
      (i) =>
        new NextRequest(CALLBACK, {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body: `email=decoy${i}%40x.io&email=victim%40x.io&password=pw`,
        }),
    )
    expect(statuses).toEqual(Array(12).fill(400))
    expect(handlerPost).not.toHaveBeenCalled()
  })

  it('RL-08: JSON bodies are keyed by their email like Auth.js reads them', async () => {
    const json = (email: unknown) =>
      new NextRequest(CALLBACK, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password: 'pw-123' }),
      })
    const statuses = await attempts(10, () => json(' Ana@X.io '))
    expect(statuses).toEqual(Array(10).fill(200))
    expect((await route.POST(json('ana@x.io'))).status).toBe(429)
    const other = await route.POST(json('bob@x.io'))
    expect(other.status).toBe(200)
    expect(await other.json()).toEqual({ email: 'bob@x.io', password: 'pw-123' })
  })

  it('RL-08: a JSON email that is not a string is rejected with 400', async () => {
    const res = await route.POST(
      new NextRequest(CALLBACK, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: ['a@x.io', 'victim@x.io'], password: 'pw' }),
      }),
    )
    expect(res.status).toBe(400)
    expect(handlerPost).not.toHaveBeenCalled()
  })

  it('RL-08: a malformed JSON body is rejected with 400', async () => {
    const res = await route.POST(
      new NextRequest(CALLBACK, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{"email":',
      }),
    )
    expect(res.status).toBe(400)
    expect(handlerPost).not.toHaveBeenCalled()
  })

  it('RL-09: an email longer than 254 characters is rejected with 400 before the limiter', async () => {
    vi.stubEnv('TRUST_PROXY_HEADER', 'x-real-ip')
    const ip = { 'x-real-ip': '203.0.113.20' }
    const long = `${'a'.repeat(247)}@x.io.vn`
    expect(long.length).toBe(255)
    const statuses = await attempts(35, () => login(long, ip))
    expect(statuses).toEqual(Array(35).fill(400))
    expect(handlerPost).not.toHaveBeenCalled()
    expect((await route.POST(login('ana@x.io', ip))).status).toBe(200)
  })

  it('RL-09: an email of exactly 254 characters after trim is accepted', async () => {
    const max = `  ${'b'.repeat(246)}@x.io.vn  `
    expect(max.trim().length).toBe(254)
    expect((await route.POST(login(max))).status).toBe(200)
  })
})
