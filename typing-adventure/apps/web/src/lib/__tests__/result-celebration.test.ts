import { describe, expect, it } from 'vitest'
import { resultCelebration, starDelays } from '../kr/result-celebration'
import { CONFETTI_LIFETIME_MS, confettiPieces } from '../kr/confetti'

describe('resultCelebration', () => {
  it('KR-10 E3 out of lives in challenge encourages without confetti', () => {
    expect(resultCelebration({ mode: 'challenge', lives: 0, stars: 2 })).toEqual({
      mood: 'encourage',
      clock: false,
      confetti: false,
    })
  })

  it('KR-10 time attack with stars shows the clock and confetti', () => {
    expect(resultCelebration({ mode: 'timeAttack', lives: 3, stars: 2 })).toEqual({
      mood: 'happy',
      clock: true,
      confetti: true,
    })
  })

  it('KR-10 time attack without stars thinks and skips confetti', () => {
    const r = resultCelebration({ mode: 'timeAttack', lives: 3, stars: 0 })
    expect(r.mood).toBe('thinking')
    expect(r.confetti).toBe(false)
  })

  it('KR-10 star count picks the mood', () => {
    expect(resultCelebration({ mode: 'classic', lives: 3, stars: 3 })).toMatchObject({
      mood: 'cheer',
      confetti: true,
      clock: false,
    })
    expect(resultCelebration({ mode: 'classic', lives: 3, stars: 2 })).toMatchObject({
      mood: 'happy',
      confetti: true,
    })
    expect(resultCelebration({ mode: 'lesson', lives: 3, stars: 1 })).toMatchObject({
      mood: 'happy',
      confetti: true,
    })
    expect(resultCelebration({ mode: 'classic', lives: 3, stars: 0 })).toMatchObject({
      mood: 'encourage',
      confetti: false,
    })
  })

  it('KR-10 star pop delays step by 220ms from 300ms', () => {
    expect(starDelays(3)).toEqual([300, 520, 740])
  })
})

describe('confettiPieces', () => {
  it('KR-10 E12 makes 24 deterministic pieces that finish within 2500ms', () => {
    const a = confettiPieces(24, 7)
    expect(a).toHaveLength(24)
    expect(confettiPieces(24, 7)).toEqual(a)
    expect(confettiPieces(24, 8)).not.toEqual(a)
    for (const p of a) {
      expect(p.delay).toBeGreaterThanOrEqual(0)
      expect(p.delay).toBeLessThanOrEqual(300)
      expect(p.duration).toBeGreaterThanOrEqual(1600)
      expect(p.duration).toBeLessThanOrEqual(2000)
      expect(p.delay + p.duration).toBeLessThanOrEqual(2500)
    }
    expect(CONFETTI_LIFETIME_MS).toBeLessThanOrEqual(2500)
  })
})
