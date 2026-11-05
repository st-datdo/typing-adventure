import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createInitialState } from '@typing-adventure/game-engine'
import { StatsBar } from '../StatsBar'
import { WordDisplay } from '../WordDisplay'

const gameState = { ...createInitialState('challenge', 'easy', 5), combo: 7, lives: 2 }

describe('Game chrome', () => {
  it('KR-05 StatsBar uses one SVG icon per card and no emoji', () => {
    const html = renderToStaticMarkup(<StatsBar gameState={gameState} />)
    expect(html).not.toMatch(/⏳|⚡|🚀|🎯|💰|👑|🔥/u)
    const cards = (html.match(/class="stat-card /g) ?? []).length
    expect(cards).toBeGreaterThan(0)
    expect((html.match(/<svg/g) ?? []).length).toBe(cards)
  })

  it('KR-05 WordDisplay combo pill shows an SVG and x7', () => {
    const html = renderToStaticMarkup(<WordDisplay gameState={gameState} onCustomText={() => {}} />)
    const pill = html.match(/<div class="combo-display[^"]*"[^>]*>[\s\S]*?<\/div>/)
    expect(pill).toBeTruthy()
    expect(pill![0]).toContain('<svg')
    expect(pill![0]).toContain('x7')
  })

  it('KR-05 WordDisplay lives use heart icons with an accessible label', () => {
    const html = renderToStaticMarkup(<WordDisplay gameState={gameState} />)
    expect(html).not.toMatch(/❤️|🖤/u)
    const lives = html.match(/<div class="lives-display[^"]*"[^>]*>[\s\S]*?<\/div>/)
    expect(lives).toBeTruthy()
    expect(lives![0]).toContain('aria-label="Còn 2/3 mạng"')
    expect((lives![0].match(/data-icon="heart"/g) ?? []).length).toBe(2)
    expect((lives![0].match(/data-icon="heartOutline"/g) ?? []).length).toBe(1)
  })

  it('KR-05 custom text button uses an SVG pencil', () => {
    const html = renderToStaticMarkup(<WordDisplay gameState={gameState} onCustomText={() => {}} />)
    expect(html).not.toContain('✏️')
    const btn = html.match(/<button[^>]*btn-custom-text[^>]*>[\s\S]*?<\/button>/)
    expect(btn![0]).toContain('data-icon="pencil"')
  })
})
