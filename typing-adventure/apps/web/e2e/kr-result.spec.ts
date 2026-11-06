import { expect, test, type Page } from '@playwright/test'
import { seedSettings, textToType, typeText } from './helpers/kr'

const finishGame = async (page: Page) => {
  await page.locator('.word-display .char').first().waitFor()
  await typeText(page, await textToType(page))
  await expect(page.locator('.celebration-content')).toBeVisible()
}

test.describe('KR result screen', () => {
  test('KR-10 modal focuses the dialog and confetti clears before 2600ms', async ({ page }) => {
    await seedSettings(page, { ageGroup: 'kid', lang: 'vi' })
    await page.goto('/')
    await finishGame(page)
    expect(await page.evaluate(() => document.activeElement?.getAttribute('role'))).toBe('dialog')
    await expect(page.locator('.confetti-piece').first()).toBeAttached()
    await page.waitForTimeout(2600)
    await expect(page.locator('.confetti-piece')).toHaveCount(0)
  })

  test('KR-10 E12 confetti is removed when the tab is hidden', async ({ page }) => {
    await seedSettings(page, { ageGroup: 'kid', lang: 'vi' })
    await page.goto('/')
    await finishGame(page)
    await expect(page.locator('.confetti-piece').first()).toBeAttached()
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'hidden',
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await expect(page.locator('.confetti-piece')).toHaveCount(0)
  })

  test('KR-10 play again starts a new round', async ({ page }) => {
    await seedSettings(page, { ageGroup: 'kid', lang: 'vi' })
    await page.goto('/')
    await finishGame(page)
    await page.locator('.celebration-actions .ui-btn--go').click()
    await expect(page.locator('.celebration-content')).toHaveCount(0)
    await expect(page.locator('.char--correct')).toHaveCount(0)
  })

  test('KR-20 modal scrolls vertically at 375x667', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await seedSettings(page, { ageGroup: 'big', lang: 'vi' })
    await page.goto('/')
    await finishGame(page)
    const box = await page.locator('.celebration-content').evaluate((el) => {
      const s = getComputedStyle(el)
      return { h: el.getBoundingClientRect().height, overflowY: s.overflowY }
    })
    expect(box.h).toBeLessThanOrEqual(667)
    expect(['auto', 'scroll']).toContain(box.overflowY)
  })
})
