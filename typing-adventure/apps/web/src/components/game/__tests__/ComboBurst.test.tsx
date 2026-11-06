import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ComboBurstView } from '../ComboBurst'
import { ComboAnnouncerView } from '../ComboAnnouncer'

describe('ComboBurst', () => {
  it('KR-09 renders the milestone, praise and 8 sparks', () => {
    const html = renderToStaticMarkup(
      <ComboBurstView milestone={{ value: 10, id: 3 }} lang="vi" reducedMotion={false} />,
    )
    expect(html).toContain('x10')
    expect(html).toContain('Siêu quá!')
    expect(html).toMatch(/class="[^"]*\bcombo-burst\b[^"]*"/)
    expect(html).toMatch(
      /<div[^>]*combo-burst[^>]*aria-hidden="true"|aria-hidden="true"[^>]*combo-burst/,
    )
    expect((html.match(/combo-spark/g) ?? []).length).toBe(8)
  })

  it('KR-14 reduced motion keeps the label but drops sparks', () => {
    const html = renderToStaticMarkup(
      <ComboBurstView milestone={{ value: 5, id: 1 }} lang="vi" reducedMotion />,
    )
    expect(html).toContain('x5')
    expect(html).not.toContain('combo-spark')
  })

  it('KR-09 renders nothing without a milestone', () => {
    expect(
      renderToStaticMarkup(<ComboBurstView milestone={null} lang="vi" reducedMotion={false} />),
    ).toBe('')
  })

  it('KR-09 announcer is always mounted as a polite live region', () => {
    const empty = renderToStaticMarkup(<ComboAnnouncerView milestone={null} lang="vi" />)
    expect(empty).toContain('aria-live="polite"')
    expect(empty).toContain('sr-only')
    const full = renderToStaticMarkup(
      <ComboAnnouncerView milestone={{ value: 10, id: 2 }} lang="vi" />,
    )
    expect(full).toContain('Chuỗi 10! Siêu quá!')
  })
})
