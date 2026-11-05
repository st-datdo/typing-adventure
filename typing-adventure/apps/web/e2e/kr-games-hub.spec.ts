import { expect, test } from '@playwright/test'
import { seedSettings, tapTargetsUnder44 } from './helpers/kr'

test.describe('KR games hub', () => {
  test.beforeEach(async ({ page }) => {
    await seedSettings(page, { ageGroup: 'kid', lang: 'vi' })
  })

  test('KR-07 entrance blocks settle to opacity 1 within 1000ms', async ({ page }) => {
    await page.goto('/games')
    await page.locator('.games-card').first().waitFor()
    await page.waitForTimeout(1000)
    const ops = await page.$$eval('.kr-enter', (els) =>
      els.map((el) => getComputedStyle(el).opacity),
    )
    expect(ops.length).toBeGreaterThan(0)
    for (const o of ops) expect(o).toBe('1')
  })

  test('KR-19 cards and back button are at least 44px at 375', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/games')
    await page.locator('.games-card').first().waitFor()
    await page.waitForTimeout(1000)
    expect(await tapTargetsUnder44(page, '.games-card, .ui-topbar a, .ui-topbar button')).toEqual(
      [],
    )
  })

  test('KR-05 tapping the balloon card opens the game', async ({ page }) => {
    await page.goto('/games')
    await page.locator('.games-card--balloon').click()
    await expect(page.locator('.games-card')).toHaveCount(0)
  })
})
