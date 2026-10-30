import { describe, expect, it } from 'vitest'
import { getTrustedClientIp, parseTrustProxyHeader } from '../rate-limit'

function ipFor(config: string | undefined, headers: Record<string, string>) {
  return getTrustedClientIp(new Headers(headers), parseTrustProxyHeader(config))
}

const both = { 'x-real-ip': ' 198.51.100.2 ', 'x-forwarded-for': '9.9.9.9, 203.0.113.7' }

describe('trusted proxy header', () => {
  it('RL-01: x-real-ip mode uses the trimmed x-real-ip', () => {
    expect(ipFor('x-real-ip', both)).toBe('198.51.100.2')
  })

  it('RL-01: x-real-ip mode ignores x-forwarded-for', () => {
    expect(ipFor('x-real-ip', { 'x-forwarded-for': '203.0.113.7' })).toBe('unknown')
  })

  it('RL-02: x-forwarded-for mode uses the last entry', () => {
    expect(ipFor('x-forwarded-for', { 'x-forwarded-for': ' 9.9.9.9 , 203.0.113.7 ' })).toBe(
      '203.0.113.7',
    )
  })

  it('RL-02: x-forwarded-for mode ignores a spoofed x-real-ip', () => {
    const honest = ipFor('x-forwarded-for', { 'x-forwarded-for': '203.0.113.7' })
    const spoofed = ipFor('x-forwarded-for', {
      'x-real-ip': '1.2.3.4',
      'x-forwarded-for': '203.0.113.7',
    })
    expect(spoofed).toBe(honest)
    expect(spoofed).toBe('203.0.113.7')
  })

  it('RL-02: x-forwarded-for mode without the header is unknown', () => {
    expect(ipFor('x-forwarded-for', { 'x-real-ip': '1.2.3.4' })).toBe('unknown')
  })

  it('RL-03: no config trusts no header', () => {
    expect(ipFor(undefined, both)).toBe('unknown')
    expect(ipFor('', both)).toBe('unknown')
  })

  it('RL-03: unknown values trust no header', () => {
    expect(ipFor('true', both)).toBe('unknown')
    expect(ipFor('forwarded', both)).toBe('unknown')
  })

  it('RL-03: config is compared after trim and lowercase', () => {
    expect(ipFor(' X-Real-IP ', both)).toBe('198.51.100.2')
    expect(ipFor('X-Forwarded-For', both)).toBe('203.0.113.7')
  })
})
