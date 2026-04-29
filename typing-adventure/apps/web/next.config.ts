import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@typing-adventure/game-engine', '@typing-adventure/i18n', '@typing-adventure/db'],
}

export default nextConfig
