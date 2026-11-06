import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { t } from '@typing-adventure/i18n'
import type { Finger } from '@typing-adventure/game-engine'
import { HandGuideView, fingerLabelSide } from '../HandGuide'

const activeIds = (html: string) =>
  [...html.matchAll(/<[^>]*id="([^"]+)"[^>]*class="[^"]*\bfinger--active\b[^"]*"[^>]*>/g)].map(
    (m) => m[1],
  )

const label = (html: string) =>
  html.match(/<div[^>]*class="[^"]*finger-label[^"]*"[^>]*>([^<]*)<\/div>/)

describe('HandGuide', () => {
  it('HF-02 f highlights left index only', () => {
    const html = renderToStaticMarkup(<HandGuideView expected="f" lang="vi" fingerGuide />)
    expect(activeIds(html)).toEqual(['finger-left-index'])
    expect(html).toMatch(
      /class="[^"]*finger-label[^"]*"[^>]*data-side="left"|data-side="left"[^>]*class="[^"]*finger-label/,
    )
    expect(label(html)?.[1]).toBe(t('vi', 'fingerLeftIndex'))
  })

  it('HF-02 j highlights right index, label right', () => {
    const html = renderToStaticMarkup(<HandGuideView expected="j" lang="en" fingerGuide />)
    expect(activeIds(html)).toEqual(['finger-right-index'])
    expect(html).toContain('data-side="right"')
    expect(label(html)?.[1]).toBe(t('en', 'fingerRightIndex'))
  })

  it('HF-02 space highlights both thumbs, label left', () => {
    const html = renderToStaticMarkup(<HandGuideView expected=" " lang="vi" fingerGuide />)
    expect(activeIds(html).sort()).toEqual(['finger-thumb-left', 'finger-thumb-right'])
    expect(html).toContain('data-side="left"')
  })

  it('HF-02 fingerLabelSide', () => {
    const cases: Record<Finger, 'left' | 'right'> = {
      'left-pinky': 'left',
      'left-ring': 'left',
      'left-middle': 'left',
      'left-index': 'left',
      'right-index': 'right',
      'right-middle': 'right',
      'right-ring': 'right',
      'right-pinky': 'right',
      thumb: 'left',
    }
    for (const [f, side] of Object.entries(cases)) {
      expect(fingerLabelSide(f as Finger), f).toBe(side)
    }
  })

  it('HF-04 fingerGuide false renders nothing', () => {
    expect(renderToStaticMarkup(<HandGuideView expected="f" lang="vi" fingerGuide={false} />)).toBe(
      '',
    )
  })

  it('HF-02 svgs are decorative', () => {
    const html = renderToStaticMarkup(<HandGuideView expected="f" lang="vi" fingerGuide />)
    const svgs = html.match(/<svg[^>]*>/g) ?? []
    expect(svgs.length).toBe(2)
    for (const s of svgs) expect(s).toContain('aria-hidden="true"')
  })

  it('HF-02 no expected char → no label', () => {
    const html = renderToStaticMarkup(<HandGuideView expected={null} lang="vi" fingerGuide />)
    expect(html).not.toContain('finger-label')
    expect(activeIds(html)).toEqual([])
  })
})
