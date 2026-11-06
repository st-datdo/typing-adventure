import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { vi as viDict, en as enDict } from '@typing-adventure/i18n'
import { GameOwlView } from '../GameOwl'
import { OwlBubbleView } from '../fx/OwlBubble'

describe('FX game owl', () => {
  it('FX-12 GameOwlView shows the fx mood, accessory and evolve state', () => {
    const html = renderToStaticMarkup(
      <GameOwlView mood="cheer" accessory="crown" evolve="phoenix" playing />,
    )
    const root = html.match(/<svg[^>]*>/)![0]
    expect(root).toContain('game-owl')
    expect(root).toContain('data-mood="cheer"')
    expect(root).toContain('data-accessory="crown"')
    expect(root).toContain('data-evolve="phoenix"')
  })

  it('FX-12 idle while playing stays still; live loops otherwise', () => {
    const idle = renderToStaticMarkup(
      <GameOwlView mood="idle" accessory={null} evolve={null} playing />,
    )
    expect(idle).toContain('owl--still')
    const sleep = renderToStaticMarkup(
      <GameOwlView mood="sleep" accessory={null} evolve={null} playing />,
    )
    expect(sleep).not.toContain('owl--still')
    expect(sleep).toContain('fx-loop')
    const waiting = renderToStaticMarkup(
      <GameOwlView mood="idle" accessory={null} evolve={null} playing={false} />,
    )
    expect(waiting).toContain('kr-loop')
  })

  it('FX-11 FX-12 OwlBubbleView renders a hidden bubble in the current language', () => {
    const vi = renderToStaticMarkup(
      <OwlBubbleView
        bubble={{ id: 1, kind: 'praise', text: 'fxOwlPraise2' }}
        lang="vi"
        suppressed={false}
      />,
    )
    const root = vi.match(/<div[^>]*class="[^"]*\bfx-owl-bubble\b[^"]*"[^>]*>/)![0]
    expect(root).toContain('data-kind="praise"')
    expect(root).toContain('aria-hidden="true"')
    expect(vi).toContain(viDict.fxOwlPraise2)
    const en = renderToStaticMarkup(
      <OwlBubbleView
        bubble={{ id: 2, kind: 'encourage', text: 'fxOwlEncourage1' }}
        lang="en"
        suppressed={false}
      />,
    )
    expect(en).toContain('data-kind="encourage"')
    expect(en).toContain(enDict.fxOwlEncourage1)
  })

  it('FX-18 suppressed or empty bubble renders nothing', () => {
    expect(
      renderToStaticMarkup(
        <OwlBubbleView
          bubble={{ id: 1, kind: 'praise', text: 'fxOwlPraise2' }}
          lang="vi"
          suppressed
        />,
      ),
    ).toBe('')
    expect(renderToStaticMarkup(<OwlBubbleView bubble={null} lang="vi" suppressed={false} />)).toBe(
      '',
    )
  })
})
