import { describe, expect, it } from 'vitest'
import { buildSecurityHeaders } from '../security-headers'

function toMap(options: Parameters<typeof buildSecurityHeaders>[0]) {
  return new Map(buildSecurityHeaders(options).map(({ key, value }) => [key, value]))
}

function connectSrc(csp: string) {
  return csp.split('; ').find((d) => d.startsWith('connect-src ')) ?? ''
}

const REQUIRED = [
  'Content-Security-Policy',
  'X-Content-Type-Options',
  'X-Frame-Options',
  'Referrer-Policy',
  'Permissions-Policy',
]

describe('buildSecurityHeaders', () => {
  it('dev allows unsafe-eval and ws:, no HSTS', () => {
    const h = toMap({ isDev: true })
    const csp = h.get('Content-Security-Policy') ?? ''
    expect(csp).toContain("'unsafe-eval'")
    expect(connectSrc(csp).split(' ')).toContain('ws:')
    expect(h.has('Strict-Transport-Security')).toBe(false)
  })

  it('prod sends HSTS and drops unsafe-eval and ws:', () => {
    const h = toMap({ isDev: false })
    const csp = h.get('Content-Security-Policy') ?? ''
    expect(csp).not.toContain("'unsafe-eval'")
    expect(connectSrc(csp).split(' ')).not.toContain('ws:')
    expect(h.get('Strict-Transport-Security')).toMatch(/max-age=\d+/)
    for (const key of REQUIRED) expect(h.has(key)).toBe(true)
  })

  it('adds http and ws origins of wsUrl to connect-src', () => {
    const csp =
      toMap({ isDev: false, wsUrl: 'https://ws.example.com/socket?x=1' }).get(
        'Content-Security-Policy',
      ) ?? ''
    expect(connectSrc(csp)).toBe("connect-src 'self' https://ws.example.com wss://ws.example.com")
  })

  it('adds the Sentry ingest origin without the DSN key', () => {
    const csp =
      toMap({ isDev: false, sentryDsn: 'https://abc@o1.ingest.sentry.io/1' }).get(
        'Content-Security-Policy',
      ) ?? ''
    expect(connectSrc(csp)).toContain('https://o1.ingest.sentry.io')
    expect(csp).not.toContain('abc@')
  })

  it('has no Sentry domain without a DSN', () => {
    const csp = toMap({ isDev: false }).get('Content-Security-Policy') ?? ''
    expect(csp).not.toContain('sentry')
    expect(connectSrc(csp)).toBe("connect-src 'self'")
  })

  it('locks down framing, objects and device APIs', () => {
    const h = toMap({ isDev: false })
    const csp = h.get('Content-Security-Policy') ?? ''
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain("worker-src 'self' blob:")
    expect(h.get('X-Frame-Options')).toBe('DENY')
    expect(h.get('Permissions-Policy')).toBe('camera=(), microphone=(), geolocation=()')
  })
})
