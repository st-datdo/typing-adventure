import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const envFile = fileURLToPath(new URL('./.env', import.meta.url))
if (existsSync(envFile)) process.loadEnvFile(envFile)

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['src/**/__tests__/**/*.int.test.ts'],
    environment: 'node',
    globalSetup: ['src/test/integration-global-setup.ts'],
    fileParallelism: false,
    testTimeout: 20000,
    env: { DATABASE_URL: process.env.DATABASE_URL ?? '' },
  },
})
