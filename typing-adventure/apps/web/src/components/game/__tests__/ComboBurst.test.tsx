import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ComboBurstView } from '../ComboBurst'
import { ComboAnnouncerView } from '../ComboAnnouncer'

const count = (html: string, re: RegExp) => (html.match(re) ?? []).length

function sideHtml(html: string, side: 'left' | 'right'): string {
  const start = html.indexOf(`combo-side--${side}`)
  if (start < 0) return ''
  const other = side === 'left' ? html.indexOf('combo-side--right') : -1
  return other > start ? html.slice(start, other) : html.slice(start)
}

describe('ComboBurst', () => {
  it('KR-09 HF-05 renders two mirrored sides with milestone and praise', () => {
    const html = renderToStaticMarkup(
      <ComboBurstView milestone={{ value: 10, id: 3 }} lang="vi" reducedMotion={false} />,
    )
    expect(html).toMatch(
      /<div[^>]*combo-burst[^>]*aria-hidden="true"|aria-hidden="true"[^>]*combo-burst/,
    )
    expect(count(html, /class="[^"]*\bcombo-side\b[^"]*"/g)).toBe(2)
    expect(html).toContain('combo-side--left')
    expect(html).toContain('combo-side--right')
    expect(count(html, /x10/g)).toBe(2)
    expect(count(html, /Siêu quá!/g)).toBe(2)
    expect(html).not.toContain('combo-spark')
  })

  it('HF-06 HF-07 spark count per milestone', () => {
    const expected: Record<number, [number, number]> = {
      5: [12, 2],
      10: [20, 4],
      20: [32, 4],
      50: [48, 6],
    }
    for (const [value, [sparks, rockets]] of Object.entries(expected)) {
      const html = renderToStaticMarkup(
        <ComboBurstView
          milestone={{ value: Number(value), id: 1 }}
          lang="vi"
          reducedMotion={false}
        />,
      )
      expect(count(html, /class="fw-spark"/g)).toBe(sparks)
      expect(count(html, /class="fw-rocket"/g)).toBe(rockets)
      const left = count(sideHtml(html, 'left'), /class="fw-spark"/g)
      const right = count(sideHtml(html, 'right'), /class="fw-spark"/g)
      expect(left).toBe(sparks / 2)
      expect(right).toBe(left)
    }
  })

  it('KR-14 HF-10 reduced motion keeps both labels but no fireworks', () => {
    const html = renderToStaticMarkup(
      <ComboBurstView milestone={{ value: 5, id: 1 }} lang="vi" reducedMotion />,
    )
    expect(count(html, /x5/g)).toBe(2)
    expect(html).not.toContain('fw-spark')
    expect(html).not.toContain('fw-rocket')
    expect(html).not.toContain('combo-spark')
  })

  it('HF-05 en praise', () => {
    const html = renderToStaticMarkup(
      <ComboBurstView milestone={{ value: 10, id: 2 }} lang="en" reducedMotion={false} />,
    )
    expect(html).toContain('Super!')
  })

  it('HF-12 suppressed renders nothing', () => {
    expect(
      renderToStaticMarkup(
        <ComboBurstView
          milestone={{ value: 10, id: 2 }}
          lang="vi"
          reducedMotion={false}
          suppressed
        />,
      ),
    ).toBe('')
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
