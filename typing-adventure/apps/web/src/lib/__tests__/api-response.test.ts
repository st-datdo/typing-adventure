import { describe, expect, it } from 'vitest'
import { tooManyRequests } from '../api-response'

describe('tooManyRequests', () => {
  it('returns 429 with the error envelope and Retry-After in seconds', async () => {
    const res = tooManyRequests(1500)
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBe('2')
    expect(await res.json()).toEqual({ success: false, error: 'Too many requests' })
  })

  it('adds a NextAuth-readable url with the error code', async () => {
    const res = tooManyRequests(0, 'http://localhost:3000/login?error=RateLimited')
    expect(res.headers.get('Retry-After')).toBe('1')
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(new URL(body.url).searchParams.get('error')).toBe('RateLimited')
  })
})
