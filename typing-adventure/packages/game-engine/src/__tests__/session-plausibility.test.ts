import { describe, expect, it } from 'vitest'
import {
  calculateResult,
  createInitialState,
  createStateFromCustomText,
  processKeypress,
} from '../engine'
import { checkSessionPlausibility, MAX_WPM } from '../plausibility'
import type { GameState } from '../types'

const TEXT = Array.from(
  { length: 40 },
  (_, i) => ['cat', 'dog', 'sun', 'happy', 'tiger'][i % 5],
).join(' ')

function play(state: GameState, chars: number, mistakeEvery = 0): GameState {
  let s = state
  for (let i = 0; i < chars && !s.isFinished; i++) {
    if (mistakeEvery > 0 && i > 0 && i % mistakeEvery === 0) {
      s = processKeypress(s, '#').newState
    }
    s = processKeypress(s, s.text[s.currentIndex]).newState
  }
  return s
}

function base(over: Partial<Parameters<typeof checkSessionPlausibility>[0]> = {}) {
  return { wpm: 60, cps: 5, accuracy: 100, score: 0, timeSeconds: 10, maxCombo: 0, ...over }
}

describe('checkSessionPlausibility', () => {
  it('SP-01: shares the multiplayer cap of 200 WPM', () => {
    expect(MAX_WPM).toBe(200)
  })

  it('SP-01: rejects wpm above MAX_WPM even when cps agrees', () => {
    expect(checkSessionPlausibility(base({ wpm: 201, cps: 16.75 }))).not.toBeNull()
  })

  it('SP-01: accepts wpm equal to MAX_WPM', () => {
    expect(checkSessionPlausibility(base({ wpm: 200, cps: 16.67 }))).toBeNull()
  })

  it('SP-02: rejects wpm that differs from 12 x cps by more than 1', () => {
    expect(checkSessionPlausibility(base({ wpm: 100, cps: 8.5 }))).not.toBeNull()
    expect(checkSessionPlausibility(base({ wpm: 100, cps: 8.42 }))).not.toBeNull()
    expect(checkSessionPlausibility(base({ wpm: 10, cps: 100 }))).not.toBeNull()
  })

  it('SP-02: accepts wpm within 1 of 12 x cps', () => {
    expect(checkSessionPlausibility(base({ wpm: 100, cps: 8.4 }))).toBeNull()
  })

  it('SP-03: rejects maxCombo above nMax', () => {
    expect(checkSessionPlausibility(base({ maxCombo: 51 }))).toBeNull()
    expect(checkSessionPlausibility(base({ maxCombo: 52 }))).not.toBeNull()
  })

  it('SP-04: accepts score equal to scoreMax and rejects one more (accuracy 100, bonus x2)', () => {
    expect(checkSessionPlausibility(base({ maxCombo: 51, score: 3672 }))).toBeNull()
    expect(checkSessionPlausibility(base({ maxCombo: 51, score: 3673 }))).not.toBeNull()
  })

  it('SP-04: caps per-char score at 10 + maxCombo and applies the accuracy bonus (90%, x1.2)', () => {
    expect(checkSessionPlausibility(base({ accuracy: 90, maxCombo: 10, score: 1170 }))).toBeNull()
    expect(
      checkSessionPlausibility(base({ accuracy: 90, maxCombo: 10, score: 1171 })),
    ).not.toBeNull()
  })

  it('SP-04: rejects a huge score claimed for a short game', () => {
    expect(checkSessionPlausibility(base({ maxCombo: 50, score: 1_000_000 }))).not.toBeNull()
  })

  it.each([12, 13.7, 29.99, 60.04, 180])(
    'SP-05: accepts a flawless engine game finished in %ss',
    (elapsed) => {
      const s = play(createStateFromCustomText(TEXT, 'easy'), TEXT.length)
      expect(s.isFinished).toBe(true)
      const r = calculateResult(s, elapsed)
      expect(r.wpm).toBeLessThanOrEqual(MAX_WPM)
      expect(checkSessionPlausibility(r)).toBeNull()
    },
  )

  it.each([3, 7, 20])('SP-05: accepts an engine game with a mistake every %i chars', (every) => {
    const s = play(createStateFromCustomText(TEXT, 'medium'), TEXT.length, every)
    const r = calculateResult(s, 41.3)
    expect(r.accuracy).toBeLessThan(100)
    expect(checkSessionPlausibility(r)).toBeNull()
  })

  it('SP-05: accepts a partly typed time-attack game', () => {
    const s = play(createInitialState('timeAttack', 'easy', 10, 0, 30), 60, 11)
    const r = calculateResult(s, 30)
    expect(checkSessionPlausibility(r)).toBeNull()
  })

  it('SP-05: accepts a one-char game where the timer never started', () => {
    const s = play(createStateFromCustomText('a', 'easy'), 1)
    expect(checkSessionPlausibility(calculateResult(s, 0))).toBeNull()
  })
})
