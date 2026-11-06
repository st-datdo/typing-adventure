import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { noHorizontalScroll, runningAnimations, seedSettings, typeText } from './helpers/kr'
import { repeatText, sampleOverlaps, startCustomText } from './helpers/hf'

const TEXT = repeatText(60)

async function setup(page: Page, settings: Record<string, unknown> = {}) {
  await seedSettings(page, { ageGroup: 'big', lang: 'vi', soundEnabled: false, ...settings })
  await page.goto('/')
  await page.locator('.word-display .char').first().waitFor()
  await page.waitForTimeout(900)
  await startCustomText(page, TEXT)
}

const sparkCount = (page: Page) => page.locator('.fw-spark').count()

async function sideSparks(page: Page) {
  return page.evaluate(() => ({
    left: document.querySelectorAll('.combo-side--left .fw-spark').length,
    right: document.querySelectorAll('.combo-side--right .fw-spark').length,
  }))
}

test.describe('HF combo celebration', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  test('HF-05 HF-06 milestone 5 shows two sides + fireworks without covering text or keys', async ({
    page,
  }) => {
    await setup(page)
    await typeText(page, TEXT.slice(0, 5))
    const t0 = Date.now()
    await expect(page.locator('.combo-side')).toHaveCount(2)
    await expect(page.locator('.combo-burst')).toContainText('x5')
    await expect(page.locator('.combo-burst')).toContainText('Giỏi lắm!')
    const s = await sideSparks(page)
    expect(s.left).toBe(s.right)
    expect(s.left).toBeGreaterThan(0)
    expect(await sampleOverlaps(page, 1300, 100)).toEqual([])
    expect(
      await page.evaluate(() => document.activeElement?.classList.contains('hidden-input')),
    ).toBe(true)
    await expect(page.locator('[aria-live="polite"].sr-only')).toContainText('Chuỗi 5! Giỏi lắm!')
    await expect(page.locator('.combo-burst')).toHaveCount(0, {
      timeout: 1500 - (Date.now() - t0) + 200,
    })
    expect(await sparkCount(page)).toBe(0)
  })

  test('HF-06 no fireworks between milestones', async ({ page }) => {
    await setup(page)
    await typeText(page, TEXT.slice(0, 5))
    await expect(page.locator('.combo-burst')).toHaveCount(0, { timeout: 1600 })
    await typeText(page, TEXT.slice(5, 9))
    expect(await sparkCount(page)).toBe(0)
  })

  test('HF-07 density per milestone', async ({ page }) => {
    await setup(page)
    const counts: number[] = []
    let typed = 0
    for (const m of [5, 10, 20, 50]) {
      await typeText(page, TEXT.slice(typed, m))
      typed = m
      await expect(page.locator('.combo-burst')).toContainText(`x${m}`)
      counts.push(await sparkCount(page))
    }
    expect(counts).toEqual([12, 20, 32, 48])
  })

  test('HF-08 miss then 5 again', async ({ page }) => {
    await setup(page)
    let max = 0
    let polling = true
    const poll = (async () => {
      while (polling) {
        const n = await page
          .locator('.fw-spark, .fw-rocket')
          .count()
          .catch(() => 0)
        max = Math.max(max, n)
        await page.waitForTimeout(50)
      }
    })()
    await typeText(page, TEXT.slice(0, 10))
    const t0 = Date.now()
    await expect(page.locator('.combo-burst')).toContainText('x10')
    const before = await sparkCount(page)
    await page.keyboard.type('~')
    expect(await sparkCount(page)).toBeLessThanOrEqual(before)
    await expect(page.locator('.combo-burst')).toHaveCount(0, {
      timeout: Math.max(100, 1500 - (Date.now() - t0)),
    })
    await typeText(page, TEXT.slice(10, 15))
    await expect(page.locator('.combo-burst')).toContainText('x5')
    expect(await sparkCount(page)).toBe(12)
    polling = false
    await poll
    expect(max).toBeLessThanOrEqual(60)
  })

  test('HF-10 reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await setup(page)
    await typeText(page, TEXT.slice(0, 5))
    const t0 = Date.now()
    await expect(page.locator('.combo-side')).toHaveCount(2)
    expect(await page.locator('.fw-spark, .fw-rocket').count()).toBe(0)
    await page.waitForTimeout(500)
    expect(await runningAnimations(page)).toBe(0)
    await expect(page.locator('.combo-burst')).toHaveCount(0, {
      timeout: Math.max(100, 1500 - (Date.now() - t0)),
    })
    await typeText(page, TEXT.slice(5, 10))
    await expect(page.locator('.combo-burst')).toContainText('x10')
    expect(await page.locator('.fw-spark, .fw-rocket').count()).toBe(0)
  })

  for (const vp of [
    { width: 375, height: 667 },
    { width: 768, height: 1024 },
  ]) {
    test(`HF-11 narrow ${vp.width}`, async ({ page }) => {
      await page.setViewportSize(vp)
      await setup(page)
      for (const [from, to] of [
        [0, 5],
        [5, 50],
      ]) {
        await typeText(page, TEXT.slice(from, to))
        await expect(page.locator('.combo-burst')).toContainText(`x${to}`)
        const end = Date.now() + 1100
        while (Date.now() < end) {
          expect(await noHorizontalScroll(page)).toBe(true)
          expect(await sampleOverlaps(page, 1, 0)).toEqual([])
          await page.waitForTimeout(100)
        }
      }
    })
  }

  test('HF-11 labels in viewport on narrow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await setup(page)
    await typeText(page, TEXT.slice(0, 5))
    const labels = page.locator('.combo-burst-value, .combo-burst-praise')
    await expect(labels.first()).toBeVisible()
    for (const box of await labels.evaluateAll((els) =>
      els.map((e) => e.getBoundingClientRect().toJSON()),
    )) {
      expect(box.left).toBeGreaterThanOrEqual(0)
      expect(box.right).toBeLessThanOrEqual(375)
      expect(box.top).toBeGreaterThanOrEqual(0)
    }
  })

  test('HF-12 finish removes effects', async ({ page }) => {
    await seedSettings(page, { ageGroup: 'big', lang: 'vi', soundEnabled: false })
    await page.goto('/')
    await page.locator('.word-display .char').first().waitFor()
    await page.waitForTimeout(900)
    const ten = repeatText(10)
    await startCustomText(page, ten)
    await typeText(page, ten)
    await expect(page.locator('.celebration-content')).toBeVisible()
    await expect(page.locator('.combo-burst')).toHaveCount(0)
  })

  test('HF-12 restart and settings panel remove effects', async ({ page }) => {
    await setup(page)
    await typeText(page, TEXT.slice(0, 5))
    await expect(page.locator('.combo-burst')).toBeVisible()
    await page.getByRole('button', { name: 'Chơi lại từ đầu' }).click()
    await expect(page.locator('.combo-burst')).toHaveCount(0)
  })

  for (const theme of ['light', 'dark', 'colorful']) {
    for (const lang of ['vi', 'en'] as const) {
      test(`HF-13 theme ${theme} lang ${lang}`, async ({ page }) => {
        const api: string[] = []
        await setup(page, { theme, lang })
        page.on('request', (r) => {
          if (r.url().includes('/api/')) api.push(r.url())
        })
        await typeText(page, TEXT.slice(0, 10))
        await expect(page.locator('.combo-burst')).toContainText(
          lang === 'vi' ? 'Siêu quá!' : 'Super!',
        )
        await page.waitForTimeout(350)
        const cut = await page.$$eval(
          '.combo-burst-praise',
          (els) => els.filter((e) => e.scrollWidth > e.clientWidth).length,
        )
        expect(cut).toBe(0)
        const res = await new AxeBuilder({ page })
          .include('.combo-side')
          .withRules(['color-contrast'])
          .analyze()
        expect(res.violations).toEqual([])
        expect(api).toEqual([])
      })
    }
  }
})
