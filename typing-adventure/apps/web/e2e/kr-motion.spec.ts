import { expect, test, type Page } from '@playwright/test'
import { runningAnimations, seedSettings, textToType, typeText } from './helpers/kr'

const settled = async (page: Page) => {
  await page.waitForTimeout(500)
  expect(await runningAnimations(page)).toBe(0)
}

test('KR-14 reduced motion: every screen settles with no running animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await seedSettings(page, { ageGroup: null, lang: 'vi' })
  await page.goto('/')
  await page.locator('.age-card').first().waitFor()
  await settled(page)

  await page.getByRole('button', { name: /6–8/ }).click()
  await page.locator('.word-display .char').first().waitFor()
  await settled(page)

  const text = await textToType(page)
  await typeText(page, text.slice(0, 5))
  await expect(page.locator('.combo-burst')).toContainText('x5')
  await expect(page.locator('.fw-spark, .fw-rocket')).toHaveCount(0)
  await settled(page)

  await typeText(page, text.slice(5))
  await expect(page.locator('.celebration-content')).toBeVisible()
  await expect(page.locator('.celebration-stars [role=img]')).toBeVisible()
  await expect(page.locator('.confetti-piece')).toHaveCount(0)
  await settled(page)

  await page.goto('/games')
  await page.locator('.games-card').first().waitFor()
  await settled(page)

  await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('typingAdventure_settings') ?? '{}')
    raw.state = { ...(raw.state ?? {}), ageGroup: 'little' }
    localStorage.setItem('typingAdventure_settings', JSON.stringify(raw))
  })
  await page.goto('/')
  await page.locator('.little-mascot').first().waitFor()
  await settled(page)
})
