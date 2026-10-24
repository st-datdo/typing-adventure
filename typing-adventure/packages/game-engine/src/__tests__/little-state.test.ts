import { describe, it, expect } from 'vitest'
import {
  createLittleState,
  littleKeypress,
  getCurrentItem,
  getExpectedChar,
  getHintLevel,
  canStartLittleSession,
  markLittleSessionStarted,
  grantBonusSession,
  sessionsLeftToday,
  nextSticker,
  pickPraiseIndex,
  clampDailyLimit,
} from '../little-state'
import { LETTER_CARDS, PICTURE_WORDS, STICKERS, PRAISE_COUNT } from '../little-content'
import type { LittleItem, LittleSession } from '../types'

const letter = (l: string): LittleItem => ({ kind: 'letter', target: l, card: LETTER_CARDS[l] })
const word = (w: string): LittleItem => ({ kind: 'word', target: w, picture: PICTURE_WORDS.find(p => p.word === w)! })

const session: LittleSession = { stages: [[letter('b'), word('cat')], [letter('s')]] }

describe('littleKeypress', () => {
  it('a wrong key keeps position and reports wrong', () => {
    const s0 = createLittleState(session, {})
    const { state, outcome } = littleKeypress(s0, 'x')
    expect(outcome).toBe('wrong')
    expect(getExpectedChar(state)).toBe('b')
    expect(state.charHadMistake).toBe(true)
  })

  it('uppercase counts and finishing a letter item reports item', () => {
    const s0 = createLittleState(session, {})
    const { state, outcome } = littleKeypress(s0, 'B')
    expect(outcome).toBe('item')
    expect(getCurrentItem(state)?.target).toBe('cat')
  })

  it('a letter found after a mistake is seen but not a first try', () => {
    let s = createLittleState(session, {})
    s = littleKeypress(s, 'x').state
    s = littleKeypress(s, 'b').state
    expect(s.progress.b).toEqual({ seen: 1, firstTry: 0 })
  })

  it('walks through a word char by char and reports stage at its end', () => {
    let s = littleKeypress(createLittleState(session, {}), 'b').state
    const r1 = littleKeypress(s, 'c')
    expect(r1.outcome).toBe('char')
    const r2 = littleKeypress(r1.state, 'a')
    expect(r2.outcome).toBe('char')
    const r3 = littleKeypress(r2.state, 't')
    expect(r3.outcome).toBe('stage')
    s = r3.state
    expect(s.progress.c).toEqual({ seen: 1, firstTry: 1 })
    expect(getExpectedChar(s)).toBe('s')
  })

  it('finishing the last item ends the session and later keys are ignored', () => {
    let s = createLittleState(session, {})
    for (const ch of ['x', 'b', 'c', 'a', 't']) s = littleKeypress(s, ch).state
    const end = littleKeypress(s, 's')
    expect(end.outcome).toBe('session')
    expect(end.state.finished).toBe(true)
    expect(end.state.foundCount).toBe(5)
    expect(getCurrentItem(end.state)).toBeNull()
    expect(littleKeypress(end.state, 's').outcome).toBe('ignored')
  })

  it('ignores keys outside a-z', () => {
    const s0 = createLittleState(session, {})
    for (const key of ['1', ' ', 'á', 'Enter', '']) {
      const r = littleKeypress(s0, key)
      expect(r.outcome, key).toBe('ignored')
      expect(r.state).toBe(s0)
    }
  })

  it('keeps existing progress and adds to it', () => {
    const s0 = createLittleState(session, { b: { seen: 4, firstTry: 2 } })
    const { state } = littleKeypress(s0, 'b')
    expect(state.progress.b).toEqual({ seen: 5, firstTry: 3 })
  })
})

describe('getHintLevel', () => {
  it('steps up at 4s and 8s of idle time', () => {
    expect(getHintLevel(3999)).toBe(0)
    expect(getHintLevel(4000)).toBe(1)
    expect(getHintLevel(7999)).toBe(1)
    expect(getHintLevel(8000)).toBe(2)
  })
})

describe('daily limit', () => {
  it('a new day always allows a session', () => {
    expect(canStartLittleSession({ date: '2026-10-23', sessions: 9, bonus: 0 }, '2026-10-24', 2)).toBe(true)
  })

  it('blocks once the limit is reached and a bonus reopens it', () => {
    expect(canStartLittleSession({ date: '2026-10-24', sessions: 2, bonus: 0 }, '2026-10-24', 2)).toBe(false)
    expect(canStartLittleSession({ date: '2026-10-24', sessions: 2, bonus: 1 }, '2026-10-24', 2)).toBe(true)
  })

  it('starting on a new day resets the counters', () => {
    expect(markLittleSessionStarted({ date: '2026-10-23', sessions: 2, bonus: 3 }, '2026-10-24'))
      .toEqual({ date: '2026-10-24', sessions: 1, bonus: 0 })
  })

  it('starting on the same day increments sessions', () => {
    expect(markLittleSessionStarted({ date: '2026-10-24', sessions: 1, bonus: 0 }, '2026-10-24').sessions).toBe(2)
  })

  it('grants a bonus for today', () => {
    expect(grantBonusSession({ date: '2026-10-24', sessions: 2, bonus: 0 }, '2026-10-24').bonus).toBe(1)
    expect(grantBonusSession({ date: '2026-10-20', sessions: 2, bonus: 4 }, '2026-10-24'))
      .toEqual({ date: '2026-10-24', sessions: 0, bonus: 1 })
  })

  it('counts sessions left today', () => {
    expect(sessionsLeftToday({ date: '2026-10-24', sessions: 1, bonus: 0 }, '2026-10-24', 2)).toBe(1)
    expect(sessionsLeftToday({ date: '2026-10-24', sessions: 5, bonus: 0 }, '2026-10-24', 2)).toBe(0)
    expect(sessionsLeftToday({ date: '2026-10-01', sessions: 5, bonus: 0 }, '2026-10-24', 2)).toBe(2)
  })

  it('clamps the daily limit to 1..5', () => {
    expect(clampDailyLimit(0)).toBe(1)
    expect(clampDailyLimit(9)).toBe(5)
    expect(clampDailyLimit(2.6)).toBe(3)
  })
})

describe('nextSticker', () => {
  it('hands out stickers in a fixed order and wraps around', () => {
    expect(nextSticker(0)).toEqual(STICKERS[0])
    expect(nextSticker(3)).toEqual(STICKERS[3])
    expect(nextSticker(30)).toEqual(STICKERS[0])
  })
})

describe('pickPraiseIndex', () => {
  it('never repeats the last praise', () => {
    expect(pickPraiseIndex(2, () => 0.4)).not.toBe(2)
    let last: number | null = null
    let seed = 0.13
    for (let i = 0; i < 100; i++) {
      seed = (seed * 9301 + 0.49297) % 1
      const idx = pickPraiseIndex(last, () => seed)
      expect(idx).toBeGreaterThanOrEqual(0)
      expect(idx).toBeLessThan(PRAISE_COUNT)
      expect(idx).not.toBe(last)
      last = idx
    }
  })
})
