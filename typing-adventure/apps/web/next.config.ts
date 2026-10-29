import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'
import { buildSecurityHeaders } from './src/lib/security-headers'

const isDev = process.env.NODE_ENV !== 'production'

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@typing-adventure/game-engine', '@typing-adventure/i18n', '@typing-adventure/db'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: buildSecurityHeaders({
          isDev,
          wsUrl: process.env.NEXT_PUBLIC_WS_URL,
          sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        }),
      },
    ]
  },
}

const sentryEnabled = !!process.env.NEXT_PUBLIC_SENTRY_DSN

export default sentryEnabled
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: !process.env.CI,
      widenClientFileUpload: true,
      disableLogger: true,
    })
  : nextConfig
