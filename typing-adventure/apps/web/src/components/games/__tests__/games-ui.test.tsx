import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Stars } from '../Stars'

describe('Stars', () => {
  it('KR-10 renders 3 SVG stars with an accessible label', () => {
    const html = renderToStaticMarkup(<Stars n={2} size="lg" animate />)
    expect(html).toMatch(/role="img"/)
    expect(html).toContain('aria-label="Đạt 2/3 sao"')
    expect((html.match(/<svg/g) ?? []).length).toBe(3)
    expect((html.match(/star--on/g) ?? []).length).toBe(2)
    expect((html.match(/star--off/g) ?? []).length).toBe(1)
    expect(html).not.toMatch(/★|☆/)
  })

  it('KR-10 animate staggers earned stars by starDelays', () => {
    const html = renderToStaticMarkup(<Stars n={3} size="lg" animate />)
    expect(html).toContain('animation-delay:300ms')
    expect(html).toContain('animation-delay:520ms')
    expect(html).toContain('animation-delay:740ms')
  })
})
