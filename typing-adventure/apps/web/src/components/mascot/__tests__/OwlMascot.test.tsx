import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { OwlMascot, OWL_MOODS, type OwlMood } from '../OwlMascot'

const MOODS: OwlMood[] = ['idle', 'wave', 'happy', 'cheer', 'encourage', 'sad', 'thinking', 'sleep']

describe('OwlMascot', () => {
  it('KR-04 supports every mood', () => {
    expect([...OWL_MOODS].sort()).toEqual([...MOODS].sort())
  })

  for (const mood of MOODS) {
    it(`KR-04 mood ${mood} renders a decorative svg owl, not an emoji`, () => {
      const html = renderToStaticMarkup(<OwlMascot mood={mood} />)
      expect(html.startsWith('<svg')).toBe(true)
      expect(html).toContain('aria-hidden="true"')
      expect(html).toContain('focusable="false"')
      expect(html).toContain(`data-mood="${mood}"`)
      expect(html).not.toContain('🦉')
      expect(html).not.toContain('💤')
    })
  }

  it('KR-04 KR-16 idle and sleep mark their loop group with kr-loop', () => {
    expect(renderToStaticMarkup(<OwlMascot mood="idle" />)).toContain('kr-loop')
    expect(renderToStaticMarkup(<OwlMascot mood="sleep" />)).toContain('kr-loop')
    expect(renderToStaticMarkup(<OwlMascot mood="happy" />)).not.toContain('kr-loop')
  })

  it('KR-16 still adds owl--still', () => {
    expect(renderToStaticMarkup(<OwlMascot mood="idle" still />)).toContain('owl--still')
    expect(renderToStaticMarkup(<OwlMascot mood="idle" />)).not.toContain('owl--still')
  })

  it('KR-04 sizes sm/md/lg map to 40/96/140', () => {
    expect(renderToStaticMarkup(<OwlMascot size="sm" />)).toContain('width="40"')
    expect(renderToStaticMarkup(<OwlMascot size="md" />)).toContain('width="96"')
    expect(renderToStaticMarkup(<OwlMascot size="lg" />)).toContain('width="140"')
    expect(renderToStaticMarkup(<OwlMascot />)).toContain('width="96"')
  })

  it('FX-04 accessory renders a marked layer for each option', () => {
    for (const acc of ['sunglasses', 'party-hat', 'crown', 'headphones', 'bowtie'] as const) {
      const html = renderToStaticMarkup(<OwlMascot mood="cheer" accessory={acc} />)
      expect(html).toContain(`data-accessory="${acc}"`)
      expect(html).toMatch(new RegExp(`<g class="owl-acc owl-acc--${acc}"`))
    }
    const plain = renderToStaticMarkup(<OwlMascot mood="cheer" />)
    expect(plain).not.toContain('data-accessory')
    expect(plain).not.toContain('owl-acc')
  })

  it('FX-04 evolve renders a marked layer for each variant', () => {
    for (const ev of ['phoenix', 'star', 'hero'] as const) {
      const html = renderToStaticMarkup(<OwlMascot mood="cheer" evolve={ev} />)
      expect(html).toContain(`data-evolve="${ev}"`)
      expect(html).toContain(`owl-evolve--${ev}`)
    }
    expect(renderToStaticMarkup(<OwlMascot mood="cheer" />)).not.toContain('owl-evolve')
  })

  it('FX-12 live owls loop with fx-loop instead of kr-loop', () => {
    for (const mood of ['idle', 'sleep', 'wave'] as const) {
      const html = renderToStaticMarkup(<OwlMascot mood={mood} live />)
      expect(html, mood).toContain('fx-loop')
      expect(html, mood).not.toContain('kr-loop')
    }
    expect(renderToStaticMarkup(<OwlMascot mood="sleep" />)).toContain('kr-loop')
    expect(renderToStaticMarkup(<OwlMascot mood="sleep" />)).not.toContain('fx-loop')
  })
})
