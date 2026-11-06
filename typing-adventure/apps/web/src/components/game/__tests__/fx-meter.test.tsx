import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ComboMeterView } from '../fx/ComboMeter'
import { nextTierInfo } from '@/lib/fx/tiers'

const root = (html: string) => html.match(/<span[^>]*class="combo-meter"[^>]*>/)![0]

describe('ComboMeter', () => {
  it('FX-06 shows combo, level and progress to the next tier', () => {
    const cases: [number, string][] = [
      [0, 'off'],
      [3, 'lit'],
      [12, 'hot'],
      [31, 'super'],
    ]
    for (const [combo, level] of cases) {
      const html = renderToStaticMarkup(<ComboMeterView combo={combo} smoke={false} />)
      const r = root(html)
      expect(r).toContain(`data-level="${level}"`)
      expect(r).toContain('aria-hidden="true"')
      expect(r).toContain('data-smoke="false"')
      const num = html.match(/<span class="combo-meter-num"[^>]*>([^<]*)<\/span>/)
      expect(num![1]).toBe(String(combo))
      expect(html).toContain('data-icon="flame"')
      const p = nextTierInfo(combo).progress
      expect(r).toMatch(new RegExp(`--fx-progress:${p}`))
    }
  })

  it('FX-13 smoke puffs', () => {
    const html = renderToStaticMarkup(<ComboMeterView combo={0} smoke />)
    expect(root(html)).toContain('data-smoke="true"')
    expect((html.match(/class="combo-meter-smoke"/g) ?? []).length).toBe(3)
    const calm = renderToStaticMarkup(<ComboMeterView combo={0} smoke={false} />)
    expect(calm).not.toContain('combo-meter-smoke')
  })

  it('FX-18 finished game shows 0 and off', () => {
    const html = renderToStaticMarkup(<ComboMeterView combo={0} smoke={false} />)
    expect(root(html)).toContain('data-level="off"')
    expect(html).toMatch(/<span class="combo-meter-num"[^>]*>0<\/span>/)
  })
})
