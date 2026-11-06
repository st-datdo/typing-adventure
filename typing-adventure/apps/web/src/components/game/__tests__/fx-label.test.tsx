import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { vi as viDict, en as enDict } from '@typing-adventure/i18n'
import { ComboLabelView } from '../fx/ComboLabel'
import { LABEL_STYLES } from '@/lib/fx/pools'
import type { FxState } from '@/lib/fx/director'

type Label = NonNullable<FxState['label']>

const label = (over: Partial<Label> = {}): Label => ({
  id: 3,
  tier: 10,
  praise: 'fxPraise2',
  style: 'ribbon',
  band: 'play',
  animate: true,
  tilt: 2,
  rise: 32,
  ...over,
})

const render = (l: Label | null, extra: { lang?: 'vi' | 'en'; suppressed?: boolean } = {}) =>
  renderToStaticMarkup(
    <ComboLabelView label={l} lang={extra.lang ?? 'vi'} suppressed={extra.suppressed ?? false} />,
  )

describe('ComboLabel', () => {
  it('FX-03 one centered label with tier and praise', () => {
    const html = render(label())
    const roots = html.match(/<div[^>]*class="[^"]*\bfx-combo-label\b[^"]*"[^>]*>/g) ?? []
    expect(roots).toHaveLength(1)
    const root = roots[0] ?? ''
    expect(root).toContain('aria-hidden="true"')
    expect(root).toContain('data-tier="10"')
    const style = root.match(/data-style="([^"]+)"/)?.[1]
    expect(LABEL_STYLES as readonly (string | undefined)[]).toContain(style)
    expect(html).toContain('x10')
    expect(html).toContain(viDict.fxPraise2)
  })

  it('FX-01 no side copies or HF fireworks', () => {
    const html = render(label())
    expect(html).not.toContain('combo-side')
    expect(html).not.toContain('fw-spark')
    expect(html).not.toContain('fw-rocket')
  })

  it('FX-15 static label', () => {
    expect(render(label({ animate: false, style: 'bubble' }))).toContain('fx-combo-label--static')
    expect(render(label())).not.toContain('fx-combo-label--static')
  })

  it('FX-18 suppressed or empty renders nothing', () => {
    expect(render(label(), { suppressed: true })).toBe('')
    expect(render(null)).toBe('')
  })

  it('FX-20 en praise', () => {
    expect(render(label(), { lang: 'en' })).toContain(enDict.fxPraise2)
  })

  it('FX-03 band class per tier band', () => {
    for (const band of ['play', 'fun', 'primary', 'rainbow'] as const) {
      expect(render(label({ band }))).toContain(`fx-combo-label--band-${band}`)
    }
    for (const style of LABEL_STYLES) {
      expect(render(label({ style }))).toContain(`fx-combo-label--${style}`)
    }
  })
})
