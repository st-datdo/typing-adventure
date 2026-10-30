import { beforeEach, describe, expect, it, vi } from 'vitest'

type Authorized = (params: { auth: unknown; request: Request }) => unknown
type Config = { callbacks?: { authorized?: Authorized } }
let captured: Config | undefined

vi.mock('next-auth', () => ({
  default: (config: Config) => {
    captured = config
    return { handlers: {}, auth: vi.fn(), signIn: vi.fn(), signOut: vi.fn() }
  },
}))
vi.mock('next-auth/providers/credentials', () => ({ default: () => ({ id: 'credentials' }) }))
vi.mock('next-auth/providers/google', () => ({ default: () => ({ id: 'google' }) }))
vi.mock('@auth/prisma-adapter', () => ({ PrismaAdapter: () => ({}) }))
vi.mock('@typing-adventure/db', () => ({ prisma: {} }))
vi.mock('bcryptjs', () => ({ default: { compare: vi.fn() } }))

async function authorized() {
  vi.resetModules()
  captured = undefined
  await import('../auth')
  const config = captured as Config | undefined
  const cb = config?.callbacks?.authorized
  expect(cb).toBeTypeOf('function')
  return cb as Authorized
}

const request = new Request('http://localhost/friends')

beforeEach(() => {
  captured = undefined
})

describe('NextAuth authorized callback', () => {
  it('AG-01: denies a request without a session', async () => {
    const cb = await authorized()
    expect(await cb({ auth: null, request })).toBe(false)
  })

  it('AG-01: denies a session object that has no user', async () => {
    const cb = await authorized()
    expect(await cb({ auth: { expires: '2099-01-01' }, request })).toBe(false)
  })

  it('AG-02: allows a request with a signed-in user', async () => {
    const cb = await authorized()
    expect(await cb({ auth: { user: { id: 'u1' }, expires: '2099-01-01' }, request })).toBe(true)
  })
})
