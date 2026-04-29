import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@typing-adventure/game-engine', '@typing-adventure/i18n'],
}

export default nextConfig
