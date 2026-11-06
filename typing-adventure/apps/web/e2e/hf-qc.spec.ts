import { expect, test, type Page } from '@playwright/test'
import { noHorizontalScroll, seedSettings, typeText } from './helpers/kr'
import { repeatText, sampleOverlaps, startCustomText } from './helpers/hf'

const TEXT = repeatText(60)

async function setup(page: Page) {
  await seedSettings(page, { ageGroup: 'big', lang: 'vi', soundEnabled: false })
  await page.goto('/')
  await page.locator('.word-display .char').first().waitFor()
  await page.waitForTimeout(900)
  await startCustomText(page, TEXT)
}

test.describe('HF QC', () => {
  for (const vp of [
    { width: 1024, height: 768 },
    { width: 1440, height: 900 },
  ]) {
    test(`HF-05 HF-06 milestones 5 and 50 do not cover text or keys at ${vp.width}`, async ({
      page,
    }) => {
      await page.setViewportSize(vp)
      await setup(page)
      for (const [from, to] of [
        [0, 5],
        [5, 50],
      ]) {
        await typeText(page, TEXT.slice(from, to))
        await expect(page.locator('.combo-burst')).toContainText(`x${to}`)
        await expect(page.locator('.combo-side')).toHaveCount(2)
        expect(await noHorizontalScroll(page)).toBe(true)
        expect(await sampleOverlaps(page, 1300, 100)).toEqual([])
        await expect(page.locator('.fw-spark')).toHaveCount(0, { timeout: 700 })
      }
    })
  }

  test('HF-12 opening SideNav removes live celebration', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await setup(page)
    await typeText(page, TEXT.slice(0, 5))
    await expect(page.locator('.combo-burst')).toBeVisible()
    await page.getByRole('button', { name: 'Menu' }).click()
    await expect(page.locator('.side-nav--open')).toBeVisible()
    await expect(page.locator('.combo-burst')).toHaveCount(0)
    await expect(page.locator('.fw-spark, .fw-rocket')).toHaveCount(0)
  })
})
