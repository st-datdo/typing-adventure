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
})
