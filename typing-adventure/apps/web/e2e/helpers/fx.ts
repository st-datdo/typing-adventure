import type { Page } from '@playwright/test'
import { typeText } from './kr'

export const FX_SELECTOR =
  '.fx-combo-label, .fx-p, .fx-word, .fx-runner, .fx-owl-bubble, canvas.fx-canvas, .fx-backdrop, .combo-meter'

export async function fxCounts(page: Page) {
  return page.evaluate(() => ({
    labels: document.querySelectorAll('.fx-combo-label').length,
    particles: document.querySelectorAll('.fx-p').length,
    canvases: document.querySelectorAll('canvas.fx-canvas[data-active="true"]').length,
    runners: document.querySelectorAll('.fx-runner').length,
  }))
}

export async function topmostReport(page: Page): Promise<string[]> {
  return page.evaluate((fxSel) => {
    const out: string[] = []
    const targets: Element[] = []
    const active = document.querySelector('.char--active')
    if (active) targets.push(active)
    document.querySelectorAll('.key, .hand-left, .hand-right').forEach((k) => targets.push(k))
    for (const t of targets) {
      const r = t.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      const x = r.left + r.width / 2
      const y = r.top + r.height / 2
      if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) continue
      const hit = document.elementFromPoint(x, y)
      if (!hit) continue
      if (hit === t || t.contains(hit)) continue
      const fxEl = hit.closest(fxSel)
      if (fxEl) out.push(`${String(fxEl.className)} over ${String(t.className)}`)
    }
    return out
  }, FX_SELECTOR)
}

export async function sampleTopmost(page: Page, ms: number, step: number): Promise<string[]> {
  const found: string[] = []
  const end = Date.now() + ms
  while (Date.now() < end) {
    found.push(...(await topmostReport(page)))
    await page.waitForTimeout(step)
  }
  return found
}

export async function typeTo(page: Page, text: string, from: number, to: number, delay = 0) {
  await typeText(page, text.slice(from, to), delay)
  return to
}
