import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { TierRunnerView } from '../fx/TierRunner'
import { FxBackdropView } from '../fx/FxBackdrop'
import { RUNNERS, SKY_VARIANTS } from '@/lib/fx/pools'

const rain = { id: 4, stickers: ['star', 'heart', 'moon'] as const, count: 18, seed: 9 }

describe('FX tier layers', () => {
  it('FX-04 TierRunnerView renders each character, hidden, with a direction', () => {
    for (const character of RUNNERS) {
      for (const direction of [1, -1] as const) {
        const html = renderToStaticMarkup(
          <TierRunnerView runner={{ id: 1, character, direction }} suppressed={false} />,
        )
        const root = html.match(/<div[^>]*class="[^"]*\bfx-runner\b[^"]*"[^>]*>/)![0]
        expect(root).toContain(`data-character="${character}"`)
        expect(root).toContain('aria-hidden="true"')
        expect(root).toContain(`--fx-dir:${direction}`)
        expect(html).toContain('<svg')
      }
    }
    expect(
      renderToStaticMarkup(
        <TierRunnerView runner={{ id: 1, character: 'dino', direction: 1 }} suppressed />,
      ),
    ).toBe('')
    expect(renderToStaticMarkup(<TierRunnerView runner={null} suppressed={false} />)).toBe('')
  })

  it('FX-04 FxBackdropView sky variants', () => {
    for (const sky of SKY_VARIANTS) {
      const html = renderToStaticMarkup(
        <FxBackdropView sky={sky} rain={null} alive={0} suppressed={false} />,
      )
      expect(html).toContain(`fx-sky--${sky}`)
    }
  })

  it('FX-04 FX-17 sticker rain respects the shared node cap', () => {
    const full = renderToStaticMarkup(
      <FxBackdropView
        sky={null}
        rain={{ ...rain, stickers: [...rain.stickers] }}
        alive={0}
        suppressed={false}
      />,
    )
    expect((full.match(/class="fx-p fx-sticker[^"]*"/g) ?? []).length).toBe(18)
    const capped = renderToStaticMarkup(
      <FxBackdropView
        sky={null}
        rain={{ ...rain, stickers: [...rain.stickers] }}
        alive={50}
        suppressed={false}
      />,
    )
    expect((capped.match(/class="fx-p fx-sticker[^"]*"/g) ?? []).length).toBe(10)
  })

  it('FX-18 suppressed hides rain but keeps the sky; root is hidden', () => {
    const html = renderToStaticMarkup(
      <FxBackdropView
        sky="rainbow"
        rain={{ ...rain, stickers: [...rain.stickers] }}
        alive={0}
        suppressed
      />,
    )
    expect(html).toContain('fx-sky--rainbow')
    expect(html).not.toContain('fx-sticker')
    expect(html.match(/<div[^>]*class="fx-backdrop"[^>]*>/)![0]).toContain('aria-hidden="true"')
  })
})
