export interface SecurityHeaderOptions {
  isDev: boolean
  wsUrl?: string
  sentryDsn?: string
}

export interface HeaderEntry {
  key: string
  value: string
}

function originOf(raw?: string): URL | null {
  if (!raw) return null
  try {
    return new URL(raw)
  } catch {
    return null
  }
}

function socketOrigins(wsUrl?: string): string[] {
  const url = originOf(wsUrl)
  if (!url) return []
  const secure = url.protocol === 'https:' || url.protocol === 'wss:'
  return [`${secure ? 'https' : 'http'}://${url.host}`, `${secure ? 'wss' : 'ws'}://${url.host}`]
}

function sentryOrigin(dsn?: string): string[] {
  const url = originOf(dsn)
  return url ? [url.origin] : []
}

function buildContentSecurityPolicy({ isDev, wsUrl, sentryDsn }: SecurityHeaderOptions): string {
  const connectSrc = [
    "'self'",
    ...socketOrigins(wsUrl),
    ...sentryOrigin(sentryDsn),
    ...(isDev ? ['ws:'] : []),
  ]
  const directives: [string, string[]][] = [
    ['default-src', ["'self'"]],
    ['script-src', ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : [])]],
    ['style-src', ["'self'", "'unsafe-inline'"]],
    ['img-src', ["'self'", 'data:', 'blob:']],
    ['font-src', ["'self'", 'data:']],
    ['media-src', ["'self'"]],
    ['connect-src', Array.from(new Set(connectSrc))],
    ['worker-src', ["'self'", 'blob:']],
    ['object-src', ["'none'"]],
    ['base-uri', ["'self'"]],
    ['frame-ancestors', ["'none'"]],
    ['form-action', ["'self'"]],
  ]
  return directives.map(([name, values]) => `${name} ${values.join(' ')}`).join('; ')
}

export function buildSecurityHeaders(options: SecurityHeaderOptions): HeaderEntry[] {
  const headers: HeaderEntry[] = [
    { key: 'Content-Security-Policy', value: buildContentSecurityPolicy(options) },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  ]
  if (!options.isDev) {
    headers.push({ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' })
  }
  return headers
}
