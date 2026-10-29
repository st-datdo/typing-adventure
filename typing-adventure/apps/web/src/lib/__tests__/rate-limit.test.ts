import { describe, expect, it } from 'vitest'
import { createRateLimiter, getClientIp } from '../rate-limit'

function clock(start = 1_000_000) {
  let t = start
  return {
    now: () => t,
    advance: (ms: number) => {
      t += ms
    },
  }
}

describe('createRateLimiter', () => {
  it('allows up to limit requests', () => {
    const c = clock()
    const limiter = createRateLimiter({ limit: 3, windowMs: 1000, now: c.now })
    const results = [1, 2, 3].map(() => limiter.check('a'))
    expect(results.every((r) => r.allowed)).toBe(true)
    expect(results.map((r) => r.remaining)).toEqual([2, 1, 0])
  })

  it('blocks request limit+1 with positive retry time', () => {
    const c = clock()
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000, now: c.now })
    limiter.check('a')
    limiter.check('a')
    c.advance(300)
    const blocked = limiter.check('a')
    expect(blocked.allowed).toBe(false)
    expect(blocked.remaining).toBe(0)
    expect(blocked.retryAfterMs).toBe(700)
  })

  it('tracks keys independently', () => {
    const c = clock()
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000, now: c.now })
    expect(limiter.check('a').allowed).toBe(true)
    expect(limiter.check('a').allowed).toBe(false)
    expect(limiter.check('b').allowed).toBe(true)
  })

  it('reopens after the window passes', () => {
    const c = clock()
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000, now: c.now })
    limiter.check('a')
    expect(limiter.check('a').allowed).toBe(false)
    c.advance(1000)
    const again = limiter.check('a')
    expect(again.allowed).toBe(true)
    expect(again.remaining).toBe(0)
  })

  it('sweeps expired keys so the map does not grow forever', () => {
    const c = clock()
    const limiter = createRateLimiter({ limit: 5, windowMs: 1000, now: c.now })
    for (let i = 0; i < 50; i++) limiter.check(`ip-${i}`)
    expect(limiter.size()).toBe(50)
    c.advance(1500)
    limiter.check('fresh')
    expect(limiter.size()).toBe(1)
  })
})

describe('getClientIp', () => {
  it('prefers x-real-ip set by the proxy', () => {
    const headers = new Headers({
      'x-real-ip': '198.51.100.2',
      'x-forwarded-for': '9.9.9.9, 198.51.100.2',
    })
    expect(getClientIp(headers)).toBe('198.51.100.2')
  })

  it('uses the last x-forwarded-for entry appended by the proxy', () => {
    const headers = new Headers({ 'x-forwarded-for': ' 9.9.9.9 , 203.0.113.7 ' })
    expect(getClientIp(headers)).toBe('203.0.113.7')
  })

  it('falls back to unknown without proxy headers', () => {
    expect(getClientIp(new Headers())).toBe('unknown')
  })

  it('cannot reset a blocked key by spoofing x-forwarded-for', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000, now: () => 0 })
    const real = { 'x-real-ip': '203.0.113.7' }
    expect(limiter.check(getClientIp(new Headers(real))).allowed).toBe(true)
    const spoofed = new Headers({ ...real, 'x-forwarded-for': '9.9.9.9' })
    expect(limiter.check(getClientIp(spoofed)).allowed).toBe(false)
    const appended = new Headers({ 'x-forwarded-for': '9.9.9.9, 203.0.113.7' })
    expect(limiter.check(getClientIp(appended)).allowed).toBe(false)
  })
})
