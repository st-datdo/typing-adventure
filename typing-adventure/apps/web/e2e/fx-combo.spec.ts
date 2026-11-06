import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { vi as viDict, en as enDict } from '@typing-adventure/i18n'
import { seedSettings, typeText } from './helpers/kr'
import { repeatText, startCustomText } from './helpers/hf'
import { fxCounts } from './helpers/fx'

const TEXT = repeatText(120)

const pool = (d: Record<string, string>, prefix: string) =>
  Object.entries(d)
    .filter(([k]) => k.startsWith(prefix))
    .map(([, v]) => v)

async function setup(page: Page, settings: Record<string, unknown> = {}, text = TEXT) {
  await seedSettings(page, { ageGroup: 'big', lang: 'vi', soundEnabled: false, ...settings })
  await page.goto('/')
  await page.locator('.word-display .char').first().waitFor()
  await page.waitForTimeout(900)
  await startCustomText(page, text)
}

async function labelGeometry(page: Page) {
  return page.evaluate(() => {
    const l = document.querySelector('.fx-combo-label')!.getBoundingClientRect()
    const w = document.querySelector('.word-display')!.getBoundingClientRect()
    const c = document.querySelector('.word-display .char')!.getBoundingClientRect()
    return {
      offset: Math.abs(l.left + l.width / 2 - (w.left + w.width / 2)),
      bottom: l.bottom,
      firstTop: c.top,
    }
  })
}

const praiseText = (page: Page) => page.locator('.fx-combo-label-praise').first().textContent()

test.describe('FX combo label', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  test('FX-01 FX-03 label centered above text', async ({ page }) => {
    await setup(page)
    await typeText(page, TEXT.slice(0, 5))
    const t0 = Date.now()
    await expect(page.locator('.fx-combo-label')).toHaveCount(1)
    await expect(page.locator('.fx-combo-label')).toContainText('x5')
    const g = await labelGeometry(page)
    expect(g.offset).toBeLessThanOrEqual(24)
    expect(g.bottom).toBeLessThanOrEqual(g.firstTop)
    await expect(page.locator('.combo-side')).toHaveCount(0)
    expect(
      await page.evaluate(() => document.activeElement?.classList.contains('hidden-input')),
    ).toBe(true)
    await expect(page.locator('[aria-live="polite"].sr-only')).toContainText('Chuỗi 5! Giỏi lắm!')
    await page.waitForTimeout(Math.max(0, 900 - (Date.now() - t0)))
    const gone = await page.evaluate(() => {
      const el = document.querySelector('.fx-combo-label')
      return !el || getComputedStyle(el).opacity === '0'
    })
    expect(gone).toBe(true)
  })

  test('FX-02 no label at 3 or 6-9', async ({ page }) => {
    await setup(page)
    await typeText(page, TEXT.slice(0, 3))
    await page.waitForTimeout(100)
    expect((await fxCounts(page)).labels).toBe(0)
    await typeText(page, TEXT.slice(3, 5))
    await expect(page.locator('.fx-combo-label')).toHaveCount(1)
    await expect(page.locator('.fx-combo-label')).toHaveCount(0, { timeout: 1200 })
    await typeText(page, TEXT.slice(5, 9))
    await page.waitForTimeout(100)
    expect((await fxCounts(page)).labels).toBe(0)
  })

  test('FX-03 E1 a new tier replaces the label at once', async ({ page }) => {
    await setup(page)
    let max = 0
    let polling = true
    const poll = (async () => {
      while (polling) {
        const n = await page.locator('.fx-combo-label').count()
        max = Math.max(max, n)
        await page.waitForTimeout(20)
      }
    })()
    await typeText(page, TEXT.slice(0, 10), 30)
    await expect(page.locator('.fx-combo-label')).toContainText('x10')
    polling = false
    await poll
    expect(max).toBe(1)
  })

  test('FX-05 praise varies across repeated tier 5', async ({ page }) => {
    await setup(page)
    const seen: string[] = []
    let i = 0
    for (let r = 0; r < 5; r++) {
      await typeText(page, TEXT.slice(i, i + 5))
      i += 5
      await expect(page.locator('.fx-combo-label')).toContainText('x5')
      seen.push((await praiseText(page)) ?? '')
      await page.keyboard.type('z')
    }
    expect(seen.filter(Boolean)).toHaveLength(5)
    for (let k = 1; k < seen.length; k++) expect(seen[k]).not.toBe(seen[k - 1])
  })

  test('FX-18 finish, replay and settings clear every effect', async ({ page }) => {
    const short = 'asdfjklasd'
    await setup(page, {}, short)
    await typeText(page, short)
    await expect(page.locator('.celebration-content')).toBeVisible()
    expect(await fxCounts(page)).toEqual({ labels: 0, particles: 0, canvases: 0, runners: 0 })
    await page.locator('.celebration-content').getByRole('button').first().click()
    await page.locator('.word-display .char').first().waitFor()
    expect(await fxCounts(page)).toEqual({ labels: 0, particles: 0, canvases: 0, runners: 0 })
    await expect(page.locator('.combo-meter-num')).toHaveText('0')

    await setup(page)
    await typeText(page, TEXT.slice(0, 5))
    await expect(page.locator('.fx-combo-label')).toHaveCount(1)
    await page.getByRole('button', { name: 'Menu' }).click()
    await page
      .locator('.side-nav-actions')
      .getByRole('button', { name: /Cài đặt/ })
      .click()
    await expect(page.getByRole('dialog')).toBeVisible()
    expect((await fxCounts(page)).labels).toBe(0)
  })

  for (const theme of ['light', 'dark', 'colorful']) {
    for (const lang of ['vi', 'en'] as const) {
      test(`FX-20 tier 10 label in ${theme} ${lang}`, async ({ page }) => {
        const api: string[] = []
        await setup(page, { theme, lang })
        page.on('request', (r) => {
          if (new URL(r.url()).pathname.startsWith('/api/')) api.push(r.url())
        })
        await typeText(page, TEXT.slice(0, 10))
        await expect(page.locator('.fx-combo-label')).toContainText('x10')
        const text = (await praiseText(page)) ?? ''
        const dict = (lang === 'vi' ? viDict : enDict) as Record<string, string>
        expect(pool(dict, 'fxPraise')).toContain(text)
        const fits = await page
          .locator('.fx-combo-label-praise')
          .evaluate((el) => el.scrollWidth <= el.clientWidth)
        expect(fits).toBe(true)
        await page.waitForTimeout(250)
        const axe = await new AxeBuilder({ page })
          .include('.fx-combo-label')
          .withRules(['color-contrast'])
          .analyze()
        expect(axe.violations).toEqual([])
        expect(api).toEqual([])
      })
    }
  }

  for (const width of [375, 768, 1024, 1440]) {
    test(`FX-03 label centered at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width < 768 ? 667 : 900 })
      await setup(page)
      await typeText(page, TEXT.slice(0, 5))
      await expect(page.locator('.fx-combo-label')).toHaveCount(1)
      const g = await labelGeometry(page)
      expect(g.offset).toBeLessThanOrEqual(24)
      expect(g.bottom).toBeLessThanOrEqual(g.firstTop)
    })
  }

  test('FX-07 pop variety without moving neighbours', async ({ page }) => {
    await setup(page)
    const kinds: string[] = []
    for (let i = 0; i < 20; i++) {
      const rects = await page.evaluate((idx) => {
        return [1, 2, 3].map((d) => {
          const el = document.querySelector(`.word-display .char[data-i="${idx + d}"]`)
          if (!el) return null
          const r = el.getBoundingClientRect()
          return { left: r.left, top: r.top }
        })
      }, i)
      await typeText(page, TEXT[i])
      const kind = await page.locator(`.word-display .char[data-i="${i}"]`).getAttribute('data-pop')
      kinds.push(kind ?? '')
      const after = await page.evaluate((idx) => {
        return [1, 2, 3].map((d) => {
          const el = document.querySelector(`.word-display .char[data-i="${idx + d}"]`)
          if (!el) return null
          const r = el.getBoundingClientRect()
          return { left: r.left, top: r.top }
        })
      }, i)
      after.forEach((a, k) => {
        const b = rects[k]
        if (!a || !b) return
        expect(Math.abs(a.left - b.left)).toBeLessThanOrEqual(0.5)
        expect(Math.abs(a.top - b.top)).toBeLessThanOrEqual(3)
      })
    }
    expect(kinds.every(Boolean)).toBe(true)
    expect(new Set(kinds).size).toBeGreaterThanOrEqual(4)
    for (let i = 1; i < kinds.length; i++) expect(kinds[i]).not.toBe(kinds[i - 1])
  })

  test('FX-08 sparks start at the typed char, stay under the cap and fade', async ({ page }) => {
    await setup(page)
    await typeText(page, TEXT[0])
    await page.waitForTimeout(30)
    const first = await page.evaluate(() => {
      const c = document.querySelector('.word-display .char[data-i="0"]')!.getBoundingClientRect()
      const ps = Array.from(document.querySelectorAll('.fx-p')).map((p) => {
        const r = p.getBoundingClientRect()
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
      })
      return { c: { l: c.left, r: c.right, t: c.top, b: c.bottom }, ps }
    })
    expect(first.ps.length).toBeGreaterThanOrEqual(3)
    expect(first.ps.length).toBeLessThanOrEqual(5)
    for (const p of first.ps) {
      expect(p.x).toBeGreaterThanOrEqual(first.c.l - 8 - 12)
      expect(p.x).toBeLessThanOrEqual(first.c.r + 8)
      expect(p.y).toBeGreaterThanOrEqual(first.c.t - 8 - 12)
      expect(p.y).toBeLessThanOrEqual(first.c.b + 8)
    }
    let max = 0
    for (let i = 1; i < 40; i++) {
      await typeText(page, TEXT[i])
      max = Math.max(max, await page.locator('.fx-p').count())
    }
    expect(max).toBeLessThanOrEqual(60)
    await page.waitForTimeout(650)
    await expect(page.locator('.fx-p')).toHaveCount(0)

    const spaceAt = TEXT.indexOf(' ', 40)
    await typeText(page, TEXT.slice(40, spaceAt))
    await page.waitForTimeout(650)
    await typeText(page, ' ')
    await page.waitForTimeout(30)
    await expect(page.locator('.fx-p')).toHaveCount(0)
  })

  test('FX-08 level some has no sparks', async ({ page }) => {
    await setup(page, { effectsLevel: 'some' })
    for (let i = 0; i < 6; i++) {
      await typeText(page, TEXT[i])
      expect(await page.locator('.fx-p').count()).toBe(0)
    }
  })

  test('FX-10 word effects vary and never cover the next char', async ({ page }) => {
    await setup(page)
    const kinds: string[] = []
    const covered: string[] = []
    let i = 0
    for (let w = 0; w < 6; w++) {
      const end = TEXT.indexOf(' ', i)
      await typeText(page, TEXT.slice(i, end))
      const kind = await page.locator('.fx-word').last().getAttribute('data-kind')
      kinds.push(kind ?? '')
      for (let k = 0; k < 4; k++) {
        const hit = await page.evaluate(() => {
          const a = document.querySelector('.char--active')
          if (!a) return null
          const r = a.getBoundingClientRect()
          const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
          return el === a || (el && a.contains(el)) ? null : String(el?.className ?? 'none')
        })
        if (hit) covered.push(hit)
        await page.waitForTimeout(100)
      }
      await page.waitForTimeout(400)
      await typeText(page, ' ')
      i = end + 1
    }
    expect(kinds.every(Boolean)).toBe(true)
    for (let k = 1; k < kinds.length; k++) expect(kinds[k]).not.toBe(kinds[k - 1])
    expect(covered).toEqual([])
  })
})
