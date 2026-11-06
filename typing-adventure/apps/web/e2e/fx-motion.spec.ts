import { expect, test, type Page } from '@playwright/test'
import { runningAnimations, seedSettings, typeText } from './helpers/kr'
import { repeatText, startCustomText } from './helpers/hf'
import { fxCounts } from './helpers/fx'

const TEXT = repeatText(80)

async function noMotion(page: Page) {
  const c = await fxCounts(page)
  expect(c.particles).toBe(0)
  expect(c.canvases).toBe(0)
  expect(c.runners).toBe(0)
  expect(await page.locator('.fx-sticker').count()).toBe(0)
}

async function settled(page: Page) {
  await page.waitForTimeout(500)
  expect(await runningAnimations(page)).toBe(0)
}

test.describe('FX reduced motion', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await seedSettings(page, {
      ageGroup: 'big',
      lang: 'vi',
      soundEnabled: false,
      effectsLevel: 'lots',
    })
    await page.goto('/')
    await page.locator('.word-display .char').first().waitFor()
    await page.waitForTimeout(900)
  })

  test('FX-15 combos up to 50, a miss and finished words stay calm', async ({ page }) => {
    await startCustomText(page, TEXT)
    const owl = page.locator('.game-owl').first()
    const moods = new Set<string>()
    for (const [from, to] of [
      [0, 5],
      [5, 10],
      [10, 15],
      [15, 20],
      [20, 30],
      [30, 40],
      [40, 50],
    ]) {
      await typeText(page, TEXT.slice(from, to))
      await noMotion(page)
      moods.add((await owl.getAttribute('data-mood')) ?? '')
      await settled(page)
      await noMotion(page)
    }
    await typeText(page, TEXT.slice(50, 51))
    const label = page.locator('.fx-combo-label')
    if (await label.count()) {
      await expect(label).toHaveClass(/--static/)
      await expect(label).toHaveCount(0, { timeout: 900 })
    }
    await page.keyboard.type('z')
    await noMotion(page)
    moods.add((await owl.getAttribute('data-mood')) ?? '')
    await settled(page)
    expect(moods.size).toBeGreaterThan(1)
  })

  test('FX-15 the tier label is static and gone within 900ms', async ({ page }) => {
    await startCustomText(page, TEXT)
    await typeText(page, TEXT.slice(0, 5))
    const label = page.locator('.fx-combo-label')
    await expect(label).toContainText('x5')
    await expect(label).toHaveClass(/--static/)
    await expect(label).toHaveCount(0, { timeout: 900 })
  })

  test('FX-15 settings show the reduced motion note', async ({ page }) => {
    await page.getByRole('button', { name: 'Menu' }).click()
    await page
      .locator('.side-nav-actions')
      .getByRole('button', { name: /Cài đặt/ })
      .click()
    await expect(page.getByRole('dialog').getByRole('note')).toContainText('giảm chuyển động')
  })
})
