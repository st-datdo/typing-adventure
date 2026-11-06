import { expect, test, type Page } from '@playwright/test'
import { noHorizontalScroll, seedSettings, typeText } from './helpers/kr'
import { overlapReport, startCustomText } from './helpers/hf'

type Box = { left: number; right: number; top: number; bottom: number; width: number }

const box = (page: Page, sel: string) =>
  page
    .locator(sel)
    .first()
    .evaluate((e) => e.getBoundingClientRect().toJSON() as Box)

async function open(page: Page, vp: { width: number; height: number }, settings = {}) {
  await page.setViewportSize(vp)
  await seedSettings(page, { ageGroup: 'big', lang: 'vi', soundEnabled: false, ...settings })
  await page.goto('/')
  await page.locator('.word-display .char').first().waitFor()
  await page.waitForTimeout(900)
}

async function openSettings(page: Page) {
  await page.getByRole('button', { name: 'Menu' }).click()
  await page
    .locator('.side-nav-actions')
    .getByRole('button', { name: /Cài đặt/ })
    .click()
}

test.describe('HF layout', () => {
  for (const vp of [
    { width: 1024, height: 768 },
    { width: 1280, height: 720 },
    { width: 1440, height: 900 },
  ]) {
    test(`HF-01 hands beside keyboard at ${vp.width}`, async ({ page }) => {
      await open(page, vp)
      const kb = await box(page, '.keyboard')
      const l = await box(page, '.hand-left')
      const r = await box(page, '.hand-right')
      expect(l.right).toBeLessThanOrEqual(kb.left + 0.5)
      expect(r.left).toBeGreaterThanOrEqual(kb.right - 0.5)
      for (const h of [l, r]) {
        expect(h.top).toBeLessThan(kb.bottom)
        expect(h.bottom).toBeGreaterThan(kb.top)
      }
      if (vp.width >= 1280) {
        expect(await page.evaluate(() => window.scrollY)).toBe(0)
        for (const b of [l, r, kb]) expect(b.bottom).toBeLessThanOrEqual(vp.height)
      }
      expect(await noHorizontalScroll(page)).toBe(true)
      expect(await overlapReport(page, '.hand-left, .hand-right', ['.key'])).toEqual([])
    })
  }

  for (const lang of ['vi', 'en'] as const) {
    test(`HF-02 finger highlight and label (${lang})`, async ({ page }) => {
      await open(page, { width: 1280, height: 720 }, { lang })
      await startCustomText(page, 'fj fj')
      const steps: [string, string[]][] = [
        ['f', ['#finger-left-index']],
        ['j', ['#finger-right-index']],
        [' ', ['#finger-thumb-left', '#finger-thumb-right']],
      ]
      for (const [ch, ids] of steps) {
        await expect(page.locator('.finger--active')).toHaveCount(ids.length)
        for (const id of ids) await expect(page.locator(`${id}.finger--active`)).toHaveCount(1)
        const label = page.locator('.finger-label')
        await expect(label).toBeVisible()
        const lb = await box(page, '.finger-label')
        expect(lb.top).toBeGreaterThanOrEqual(0)
        expect(lb.bottom).toBeLessThanOrEqual(720)
        expect(await overlapReport(page, '.finger-label', ['.key', '.word-display .char'])).toEqual(
          [],
        )
        await typeText(page, ch)
      }
    })
  }

  for (const vp of [
    { width: 375, height: 667 },
    { width: 768, height: 1024 },
  ]) {
    test(`HF-03 narrow layout at ${vp.width}`, async ({ page }) => {
      await open(page, vp)
      expect(await noHorizontalScroll(page)).toBe(true)
      const { kbWidth, content } = await page.evaluate(() => {
        const main = document.querySelector('.main') as HTMLElement
        const cs = getComputedStyle(main)
        const content = main.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
        const kbWidth = document.querySelector('.keyboard')!.getBoundingClientRect().width
        return { kbWidth, content }
      })
      expect(kbWidth).toBeGreaterThanOrEqual(Math.min(820, content) - 1)
      await expect(page.locator('.hand-left')).toBeVisible()
      await expect(page.locator('.hand-right')).toBeVisible()
      expect(
        await overlapReport(page, '.hand-left, .hand-right', ['.key', '.word-display']),
      ).toEqual([])
      await startCustomText(page, 'fff')
      await expect(page.locator('#finger-left-index.finger--active')).toHaveCount(1)
    })
  }

  for (const width of [375, 1024, 1440]) {
    test(`HF-04 finger guide off at ${width}`, async ({ page }) => {
      await open(page, { width, height: 900 }, { fingerGuide: false })
      await expect(page.locator('.hand-svg')).toHaveCount(0)
      await expect(page.locator('.keyboard')).toHaveClass(/keyboard--hide-fingers/)
      const m = await page.evaluate(() => {
        const main = document.querySelector('.main') as HTMLElement
        const cs = getComputedStyle(main)
        const mr = main.getBoundingClientRect()
        const kr = document.querySelector('.keyboard')!.getBoundingClientRect()
        const content = main.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
        return {
          kbCenter: kr.left + kr.width / 2,
          mainCenter: mr.left + mr.width / 2,
          kbWidth: kr.width,
          content,
        }
      })
      expect(Math.abs(m.kbCenter - m.mainCenter)).toBeLessThanOrEqual(2)
      expect(Math.abs(m.kbWidth - Math.min(820, m.content))).toBeLessThanOrEqual(1)
    })
  }

  test('HF-04 re-enable finger guide from settings without reload', async ({ page }) => {
    await open(page, { width: 1440, height: 900 }, { fingerGuide: false })
    await page.evaluate(() => ((window as unknown as { __hfMark: number }).__hfMark = 1))
    await openSettings(page)
    await page.locator('.ta-field', { hasText: 'Hướng dẫn ngón tay' }).locator('.ta-toggle').click()
    await page.getByRole('dialog').getByRole('button', { name: 'Đóng' }).click()
    await expect(page.locator('.hand-left')).toBeVisible()
    expect(await page.evaluate(() => (window as unknown as { __hfMark?: number }).__hfMark)).toBe(1)
  })

  test('HF-12 panels suppress', async ({ page }) => {
    await open(page, { width: 1280, height: 720 })
    await openSettings(page)
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.locator('.fx-combo-label')).toHaveCount(0)
  })
})
