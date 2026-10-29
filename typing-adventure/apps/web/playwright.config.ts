import { defineConfig, devices } from '@playwright/test'

const port = process.env.PORT
if (!port || !/^\d+$/.test(port)) {
  throw new Error(
    'PORT is not set. Load the worktree env first: set -a && . ../.wt-env && set +a (scripts/wt-new.sh writes it).',
  )
}

const baseURL = `http://localhost:${port}`

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: { baseURL },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm dev:ws',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 180_000,
    stdout: 'pipe',
  },
})
