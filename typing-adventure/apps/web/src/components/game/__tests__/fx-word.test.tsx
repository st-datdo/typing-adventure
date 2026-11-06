import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createInitialState } from '@typing-adventure/game-engine'
import { WordDisplay } from '../WordDisplay'
import { WordCompleteFxView } from '../fx/WordCompleteFx'
import { WORD_FX_KINDS } from '@/lib/fx/pools'

const gameState = { ...createInitialState('classic', 'easy', 5), currentIndex: 4 }

describe('FX char pop and word effects', () => {
  it('FX-07 the typed char carries data-pop and every char has data-i', () => {
    const html = renderToStaticMarkup(
      <WordDisplay gameState={gameState} pop={{ index: 2, kind: 'hop', id: 1 }} />,
    )
    const chars = html.match(/<span[^>]*class="char[^"]*"[^>]*>/g) ?? []
    expect(chars.length).toBe(gameState.text.length)
    chars.forEach((c, i) => expect(c).toContain(`data-i="${i}"`))
    const popped = chars.filter((c) => c.includes('data-pop='))
    expect(popped).toHaveLength(1)
    expect(popped[0]).toContain('data-i="2"')
    expect(popped[0]).toContain('data-pop="hop"')
    expect(html).not.toContain('char--pop')
    expect(html).not.toContain('char--word-burst')
  })

  it('FX-07 no pop without a pop slot', () => {
    const html = renderToStaticMarkup(<WordDisplay gameState={gameState} pop={null} />)
    expect(html).not.toContain('data-pop=')
  })

  it('FX-08 FX-10 effect layers sit inside the text section and are hidden', () => {
    const html = renderToStaticMarkup(<WordDisplay gameState={gameState} />)
    expect(html).toMatch(/<div class="fx-word-layer" aria-hidden="true"/)
    expect(html).toMatch(/<div class="fx-runner-track" aria-hidden="true"/)
  })

  it('FX-10 every word effect kind renders a hidden .fx-word', () => {
    for (const kind of WORD_FX_KINDS) {
      const html = renderToStaticMarkup(
        <WordCompleteFxView
          kind={kind}
          rect={{ left: 10, top: 20, width: 80, height: 30 }}
          tilt={6}
          fly={{ dx: -40, dy: -120 }}
        />,
      )
      const root = html.match(/<div[^>]*class="[^"]*\bfx-word\b[^"]*"[^>]*>/)
      expect(root, kind).toBeTruthy()
      expect(root![0]).toContain(`data-kind="${kind}"`)
      expect(root![0]).toContain('aria-hidden="true"')
    }
  })

  it('FX-04 super mode marks the word display', () => {
    const on = renderToStaticMarkup(<WordDisplay gameState={gameState} superMode="gold" />)
    expect(on).toMatch(/<div class="word-display"[^>]*data-fx-super="gold"/)
    const off = renderToStaticMarkup(<WordDisplay gameState={gameState} />)
    expect(off).not.toContain('data-fx-super')
  })
})
