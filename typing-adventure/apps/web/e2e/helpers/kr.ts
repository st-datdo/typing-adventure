import type { Page } from '@playwright/test'

export const SETTINGS_KEY = 'typingAdventure_settings'

export async function seedSettings(page: Page, partialState: Record<string, unknown>) {
  await page.addInitScript(
    ([key, state]) => {
      if (sessionStorage.getItem('__kr_seeded') === '1') return
      sessionStorage.setItem('__kr_seeded', '1')
      localStorage.setItem(key as string, JSON.stringify({ state, version: 1 }))
    },
    [SETTINGS_KEY, partialState] as const,
  )
}

export async function readSettings(page: Page): Promise<Record<string, unknown>> {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw).state ?? {}) : {}
  }, SETTINGS_KEY)
}

export async function textToType(page: Page): Promise<string> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('.word-display .char'))
      .map((el) => {
        const c = el.textContent ?? ''
        return c === ' ' ? ' ' : c
      })
      .join(''),
  )
}

export async function typeText(page: Page, text: string, delay = 0) {
  for (const ch of text) {
    if (ch === ' ') await page.keyboard.press('Space', { delay })
    else await page.keyboard.type(ch, { delay })
  }
}

export async function runningAnimations(page: Page): Promise<number> {
  return page.evaluate(
    () => document.getAnimations().filter((a) => a.playState === 'running').length,
  )
}

export async function noHorizontalScroll(page: Page): Promise<boolean> {
  return page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  )
}

export async function tapTargetsUnder44(page: Page, selector: string): Promise<string[]> {
  return page.evaluate((sel) => {
    const out: string[] = []
    document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
      const r = el.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) return
      const style = getComputedStyle(el)
      if (style.visibility === 'hidden' || style.display === 'none') return
      if (el.closest('[inert]') || el.closest('[aria-hidden="true"]')) return
      if (r.width < 44 || r.height < 44) {
        const name = el.getAttribute('aria-label') ?? el.textContent?.trim().slice(0, 30) ?? ''
        out.push(
          `${el.tagName.toLowerCase()}.${el.className} "${name}" ${Math.round(r.width)}x${Math.round(r.height)}`,
        )
      }
    })
    return out
  }, selector)
}
