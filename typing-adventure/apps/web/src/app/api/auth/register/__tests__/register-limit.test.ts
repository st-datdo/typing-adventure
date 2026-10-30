import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const findUnique = vi.fn(async () => null as unknown)
const create = vi.fn(
  async ({ data }: { data: { name: string; email: string; avatar: string } }) => ({
    id: 'u1',
    name: data.name,
    email: data.email,
    avatar: data.avatar,
    createdAt: new Date(0),
  }),
)

vi.mock('@typing-adventure/db', () => ({
  prisma: { user: { findUnique: () => findUnique(), create: (args: never) => create(args) } },
}))

vi.mock('bcryptjs', () => ({ default: { hash: vi.fn(async () => 'hashed') } }))

type Route = typeof import('../route')
let route: Route
let counter = 0

function register(headers: Record<string, string> = {}, body?: unknown) {
  counter += 1
  return new NextRequest('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(
      body ?? { name: 'Ana', email: `ana${counter}@x.io`, password: 'pw-123456' },
    ),
  })
}

async function statuses(n: number, make: () => NextRequest) {
  const out: number[] = []
  for (let i = 0; i < n; i++) out.push((await route.POST(make())).status)
  return out
}

let warn: ReturnType<typeof vi.spyOn>

beforeEach(async () => {
  vi.resetModules()
  vi.unstubAllEnvs()
  findUnique.mockClear()
  create.mockClear()
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  route = await import('../route')
})

afterEach(() => {
  warn.mockRestore()
})

describe('POST /api/auth/register limiter', () => {
  it('RG-01: trusts x-real-ip and answers the 6th attempt from one IP with 429', async () => {
    vi.stubEnv('TRUST_PROXY_HEADER', 'x-real-ip')
    const ip = { 'x-real-ip': ' 203.0.113.7 ' }
    expect(await statuses(5, () => register(ip))).toEqual(Array(5).fill(200))
    const blocked = await route.POST(register({ 'x-real-ip': '203.0.113.7' }))
    expect(blocked.status).toBe(429)
    expect(blocked.headers.get('Retry-After')).toBeTruthy()
    expect(await blocked.json()).toEqual({ success: false, error: 'Too many requests' })
  })

  it('RG-01: a request with only x-forwarded-for is not counted in that IP bucket', async () => {
    vi.stubEnv('TRUST_PROXY_HEADER', 'x-real-ip')
    await statuses(5, () => register({ 'x-real-ip': '203.0.113.7' }))
    const res = await route.POST(register({ 'x-forwarded-for': '9.9.9.9, 203.0.113.7' }))
    expect(res.status).toBe(200)
  })

  it('RG-02: keys by the last x-forwarded-for entry and ignores a spoofed x-real-ip', async () => {
    vi.stubEnv('TRUST_PROXY_HEADER', 'x-forwarded-for')
    const xff = { 'x-forwarded-for': '9.9.9.9, 203.0.113.7' }
    expect(await statuses(5, () => register(xff))).toEqual(Array(5).fill(200))
    const spoofed = await route.POST(register({ ...xff, 'x-real-ip': '198.51.100.1' }))
    expect(spoofed.status).toBe(429)
  })

  it('RG-02: another client IP keeps its own budget', async () => {
    vi.stubEnv('TRUST_PROXY_HEADER', 'x-forwarded-for')
    await statuses(6, () => register({ 'x-forwarded-for': '203.0.113.7' }))
    const res = await route.POST(register({ 'x-forwarded-for': '9.9.9.9, 203.0.113.8' }))
    expect(res.status).toBe(200)
  })

  it('RG-03: without a trusted header no site-wide unknown bucket locks registration', async () => {
    const out = await statuses(7, () => register())
    expect(out).toEqual(Array(7).fill(200))
    expect(create).toHaveBeenCalledTimes(7)
  })

  it('RG-03: a trusted header that is missing does not share one unknown bucket', async () => {
    vi.stubEnv('TRUST_PROXY_HEADER', 'x-real-ip')
    expect(await statuses(7, () => register({ 'x-forwarded-for': '203.0.113.7' }))).toEqual(
      Array(7).fill(200),
    )
  })

  it('RG-03: validation and duplicate checks still run when the IP is unknown', async () => {
    expect((await route.POST(register({}, { name: '', email: 'bad', password: '1' }))).status).toBe(
      400,
    )
    findUnique.mockResolvedValueOnce({ id: 'existing' })
    expect((await route.POST(register())).status).toBe(409)
  })

  it('RG-04: warns exactly once per process in production without TRUST_PROXY_HEADER', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    await statuses(3, () => register())
    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0][0])).toContain('TRUST_PROXY_HEADER')
  })

  it('RG-04: an invalid TRUST_PROXY_HEADER in production also warns once', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('TRUST_PROXY_HEADER', 'x-client-ip')
    await statuses(2, () => register())
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('RG-04: does not warn when the header is configured or outside production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('TRUST_PROXY_HEADER', 'x-forwarded-for')
    await statuses(2, () => register({ 'x-forwarded-for': '203.0.113.7' }))
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('TRUST_PROXY_HEADER', '')
    await statuses(2, () => register())
    expect(warn).not.toHaveBeenCalled()
  })
})
