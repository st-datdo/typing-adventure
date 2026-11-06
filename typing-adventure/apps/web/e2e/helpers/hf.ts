import type { Page } from '@playwright/test'

export interface Rect {
  left: number
  top: number
  right: number
  bottom: number
}

export function rectsIntersect(a: Rect, b: Rect): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
}

export async function overlapReport(
  page: Page,
  effectSel: string,
  targetSels: string[],
): Promise<string[]> {
  return page.evaluate(
    ([eff, targets]) => {
      const hit = (a: DOMRect, b: DOMRect) =>
        a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
      const out: string[] = []
      const effects = Array.from(document.querySelectorAll(eff as string)).filter((e) => {
        const r = e.getBoundingClientRect()
        return r.width > 0 && r.height > 0 && getComputedStyle(e).opacity !== '0'
      })
      for (const sel of targets as string[]) {
        const tgs = Array.from(document.querySelectorAll(sel)).map((t) => t.getBoundingClientRect())
        for (const e of effects) {
          const r = e.getBoundingClientRect()
          for (const t of tgs) {
            if (t.width > 0 && t.height > 0 && hit(r, t)) {
              out.push(`${e.className} x ${sel}`)
              break
            }
          }
        }
      }
      return out
    },
    [effectSel, targetSels] as const,
  )
}

export async function sampleOverlaps(
  page: Page,
  ms: number,
  step: number,
  effectSel = '.combo-burst-value, .combo-burst-praise, .fw-spark, .fw-rocket',
  targetSels = ['.word-display .char', '.key'],
): Promise<string[]> {
  const found: string[] = []
  const end = Date.now() + ms
  while (Date.now() < end) {
    found.push(...(await overlapReport(page, effectSel, targetSels)))
    await page.waitForTimeout(step)
  }
  return found
}

export async function startCustomText(page: Page, text: string) {
  await page.locator('.btn-custom-text').click()
  await page.locator('.ta-textarea').fill(text)
  await page.locator('.ta-modal-actions .ui-btn--go').click()
  await page.locator('.ta-textarea').waitFor({ state: 'detached' })
  await page.locator('.word-display .char').first().waitFor()
  await page.locator('.hidden-input').focus()
}

export function repeatText(len: number): string {
  const base = 'asdf jkl '
  let s = ''
  while (s.length < len) s += base
  return s.slice(0, len).replace(/ $/, 'a')
}
