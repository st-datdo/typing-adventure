import { expect, test } from '@playwright/test'

test('home page renders', async ({ page }) => {
  const res = await page.goto('/')
  expect(res?.status()).toBe(200)
  await expect(page).toHaveTitle(/Typing Adventure/)
})

test('GET /api/leaderboard returns the success envelope', async ({ request }) => {
  const res = await request.get('/api/leaderboard')
  expect(res.status()).toBe(200)
  const body = await res.json()
  expect(body.success).toBe(true)
  expect(Array.isArray(body.data)).toBe(true)
})

test('Socket.IO polling handshake answers on the worktree port', async ({ request }) => {
  const res = await request.get('/socket.io/?EIO=4&transport=polling')
  expect(res.status()).toBe(200)
  expect(new URL(res.url()).port).toBe(process.env.PORT)
  expect(await res.text()).toContain('"sid"')
})
