import { describe, expect, it } from 'vitest'
import { cssBlocks, readStyle, resolveVar, ruleFor, rulesMatching, toMs, toPx } from './css-helpers'

const ui = readStyle('ui.css')
const game = readStyle('game.css')

function borderWidth(border: string | undefined): number {
  if (!border) return NaN
  return toPx(border.split(' ')[0])
}

function radiusOk(radius: string | undefined): boolean {
  if (!radius) return false
  const px = toPx(radius)
  return px >= 999 || (px >= 16 && px <= 32)
}

function durations(transition: string | undefined): number[] {
  if (!transition) return []
  return [...resolveVar(transition).matchAll(/([\d.]+)(ms|s)\b/g)].map((m) =>
    m[2] === 's' ? parseFloat(m[1]) * 1000 : parseFloat(m[1]),
  )
}

function pressOk(transform: string | undefined): boolean {
  if (!transform) return false
  const ty = transform.match(/translateY\(\s*([\d.]+)px\s*\)/)
  if (ty) {
    const v = parseFloat(ty[1])
    if (v >= 2 && v <= 4) return true
  }
  const sc = transform.match(/scale\(\s*([\d.]+)\s*\)/)
  if (sc) {
    const v = parseFloat(sc[1])
    if (v >= 0.92 && v <= 0.97) return true
  }
  return false
}

describe('KR clay shared components', () => {
  for (const sel of ['.ui-btn', '.ui-chip', '.ui-card', '.ui-modal']) {
    it(`KR-01 ${sel} has thick border, rounded corners and clay shadow`, () => {
      const r = ruleFor(ui, sel)
      const bw = borderWidth(r.border)
      expect(bw, `${sel} border ${r.border}`).toBeGreaterThanOrEqual(3)
      expect(bw, `${sel} border ${r.border}`).toBeLessThanOrEqual(4)
      expect(radiusOk(r['border-radius']), `${sel} radius ${r['border-radius']}`).toBe(true)
      expect(r['box-shadow'], `${sel} shadow`).toMatch(/var\(--kr-shadow-(sm|md|lg)\)/)
    })
  }

  for (const sel of ['.ui-btn', '.ui-chip']) {
    it(`KR-08 ${sel} presses down within 200ms and uses a pointer cursor`, () => {
      const base = ruleFor(ui, sel)
      expect(base.cursor).toBe('pointer')
      const ds = durations(base.transition)
      expect(ds.length).toBeGreaterThan(0)
      expect(Math.max(...ds)).toBeLessThanOrEqual(200)
      const active = ruleFor(ui, `${sel}:active`)
      expect(pressOk(active.transform), `${sel}:active ${active.transform}`).toBe(true)
      expect(active['box-shadow']).toMatch(/--kr-shadow-pressed/)
    })

    it(`KR-08 ${sel} disabled has no press effect and a not-allowed cursor`, () => {
      const dis = ruleFor(ui, `${sel}:disabled`)
      expect(dis.cursor).toBe('not-allowed')
      expect(dis.transform).toBe('none')
      const disActive = rulesMatching(ui, (s) => s === `${sel}:disabled:active`)
      expect(disActive.length).toBeGreaterThan(0)
    })
  }

  it('KR-08 hover lift only applies on devices that can hover', () => {
    expect(ui).toMatch(/@media\s*\(hover:\s*hover\)/)
    const naked = rulesMatching(ui, (s) => s === '.ui-btn:hover' || s === '.ui-chip:hover')
    for (const b of naked) {
      const idx = ui.indexOf(b.body)
      const before = ui.slice(0, idx)
      const lastMedia = before.lastIndexOf('@media (hover: hover)')
      expect(lastMedia, 'hover rule inside @media (hover: hover)').toBeGreaterThan(-1)
    }
  })

  it('KR-18 focus ring is 3px solid --kr-ring with offset >= 3px for buttons, links, inputs and radios', () => {
    const focus = cssBlocks(ui).find(
      (b) =>
        b.selectors.some((s) => s.includes(':focus-visible')) &&
        b.selectors.some((s) => /\bbutton\b/.test(s)),
    )
    expect(focus, 'global focus-visible rule').toBeTruthy()
    const sel = focus!.selectors.join(',')
    for (const part of ['a', 'button', 'select', 'input', '[role="radio"]', '[tabindex]']) {
      expect(sel).toContain(part)
    }
    const d = ruleFor(ui, focus!.selectors[0])
    expect(d.outline).toBe('3px solid var(--kr-ring)')
    expect(toPx(d['outline-offset'])).toBeGreaterThanOrEqual(3)
  })

  it('KR-18 hidden game input keeps no focus outline', () => {
    const hidden = cssBlocks(ui + game).filter((b) =>
      b.selectors.some((s) => s.startsWith('.hidden-input:focus')),
    )
    expect(hidden.length).toBeGreaterThan(0)
    expect(hidden.some((b) => /outline:\s*none/.test(b.body))).toBe(true)
  })

  it('KR-19 small buttons and chips are at least 44px', () => {
    expect(toPx(ruleFor(ui, '.ui-btn--sm')['min-height'])).toBeGreaterThanOrEqual(44)
    expect(toPx(ruleFor(ui, '.ui-chip')['min-height'])).toBeGreaterThanOrEqual(44)
    expect(toPx(ruleFor(ui, '.ui-chip')['min-width'])).toBeGreaterThanOrEqual(44)
  })

  it('KR-17 colored buttons use on-color tokens instead of hard-coded text colors', () => {
    const colored = rulesMatching(ui, (s) => s.startsWith('.ui-btn--'))
    expect(colored.length).toBeGreaterThan(0)
    for (const b of colored) {
      expect(b.body, b.selectors.join(',')).not.toMatch(/color:\s*(#fff\b|#ffffff\b|#3b3355)/i)
    }
    for (const sel of ['.ui-btn--primary', '.ui-btn--sun', '.ui-btn--go', '.ui-btn--danger']) {
      expect(ruleFor(ui, sel).color, sel).toMatch(/var\(--kr-on-/)
    }
  })

  it('KR-08 press timing tokens are within 200ms', () => {
    expect(toMs('var(--kr-dur-press)')).toBeLessThanOrEqual(200)
    expect(toMs('var(--kr-dur-hover)')).toBeLessThanOrEqual(200)
  })
})
