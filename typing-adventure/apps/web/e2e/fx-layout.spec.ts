import { expect, test, type Page } from '@playwright/test'
import { noHorizontalScroll, seedSettings, typeText } from './helpers/kr'
import { overlapReport, repeatText, startCustomText } from './helpers/hf'
import { topmostReport } from './helpers/fx'

const TEXT = repeatText(110)

const VIEWPORTS = [
  { width: 375, height: 667 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
]

async function boot(page: Page, vp: { width: number; height: number }, fingerGuide: boolean) {
  await page.setViewportSize(vp)
  await seedSettings(page, {
    ageGroup: 'big',
    lang: 'vi',
    soundEnabled: false,
    effectsLevel: 'lots',
    fingerGuide,
  })
  await page.goto('/')
  await page.locator('.word-display .char').first().waitFor()
  await page.waitForTimeout(900)
  await startCustomText(page, TEXT)
}

async function interactiveFx(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('[class*="fx-"], .combo-meter'))
      .filter((el) => !el.matches('.word-display, .word-foot, .ta-screen'))
      .filter((el) => getComputedStyle(el).pointerEvents !== 'none')
      .map((el) => el.getAttribute('class') ?? el.tagName),
  )
}

async function meterMatchesStreak(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const num = document.querySelector('.combo-meter-num')
    if (!num) return null
    const chars = Array.from(document.querySelectorAll('.word-display .char'))
    let streak = 0
    for (const c of chars) {
      if (c.classList.contains('char--correct')) streak += 1
      else if (c.classList.contains('char--wrong') || c.classList.contains('char--error'))
        streak = 0
    }
    const shown = Number(num.textContent)
    return shown === streak ? null : `meter ${shown} vs streak ${streak}`
  })
}

for (const vp of VIEWPORTS) {
  for (const fingerGuide of [true, false]) {
    test(`FX-06 FX-11 FX-19 ${vp.width}x${vp.height} fingers ${fingerGuide ? 'on' : 'off'} fx never covers input`, async ({
      page,
    }) => {
      test.setTimeout(120_000)
      await boot(page, vp, fingerGuide)
      const issues: string[] = []
      let polling = true
      const poll = (async () => {
        while (polling) {
          const s = await Promise.all([
            topmostReport(page),
            noHorizontalScroll(page),
            interactiveFx(page),
            overlapReport(page, '.combo-meter', [
              '.word-display .char',
              '.key',
              '.hand-left',
              '.hand-right',
            ]),
            meterMatchesStreak(page),
          ]).catch(() => null)
          if (s) {
            const [top, noScroll, live, meter, streak] = s
            issues.push(...top)
            if (!noScroll) issues.push('horizontal scroll')
            issues.push(...live.map((c) => `pointer-events on ${c}`))
            issues.push(...meter)
            if (streak) issues.push(streak)
          }
          await page.waitForTimeout(100)
        }
      })()
      await typeText(page, TEXT.slice(0, 100), 30)
      polling = false
      await poll
      expect(await page.locator('.char--correct').count()).toBe(100)
      expect([...new Set(issues)]).toEqual([])
    })
  }
}

test('FX-19 E11 at 375px the on-screen keys still type while fx run', async ({ page }) => {
  await boot(page, { width: 375, height: 667 }, true)
  await typeText(page, TEXT.slice(0, 9))
  await page.waitForTimeout(1000)
  await typeText(page, TEXT.slice(9, 10))
  await expect(page.locator('.fx-combo-label')).toBeVisible()
  for (let i = 10; i < 14; i++) {
    const ch = TEXT[i]
    const before = await page.locator('.char--correct').count()
    const sel = `.key[data-key="${ch === ' ' ? ' ' : ch.toLowerCase()}"]`
    const box = await page.evaluate((q) => {
      const el = document.querySelector(q)!
      el.scrollIntoView({ block: 'center' })
      const r = el.getBoundingClientRect()
      return { x: r.left, y: r.top, width: r.width, height: r.height }
    }, sel)
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
    await expect(page.locator('.char--correct')).toHaveCount(before + 1)
  }
})
