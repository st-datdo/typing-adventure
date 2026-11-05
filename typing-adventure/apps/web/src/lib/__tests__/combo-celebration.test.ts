import { describe, expect, it } from 'vitest'
import {
  COMBO_BURST_MS,
  INITIAL_CELEBRATION,
  nextCelebration,
  praiseKey,
} from '../kr/combo-celebration'

describe('combo celebration reducer', () => {
  it('KR-09 a milestone hit shows that milestone with a fresh id', () => {
    const s = nextCelebration(INITIAL_CELEBRATION, { type: 'hit', combo: 5 })
    expect(s.milestone).toEqual({ value: 5, id: 1 })
  })

  it('KR-09 non-milestone hits do not change state', () => {
    const s = nextCelebration(INITIAL_CELEBRATION, { type: 'hit', combo: 4 })
    expect(s).toBe(INITIAL_CELEBRATION)
  })

  it('KR-09 E1 a newer milestone replaces the current one immediately', () => {
    const a = nextCelebration(INITIAL_CELEBRATION, { type: 'hit', combo: 5 })
    const b = nextCelebration(a, { type: 'hit', combo: 10 })
    expect(b.milestone?.value).toBe(10)
    expect(b.milestone!.id).toBeGreaterThan(a.milestone!.id)
  })

  it('KR-09 clear only removes the matching id', () => {
    const a = nextCelebration(INITIAL_CELEBRATION, { type: 'hit', combo: 5 })
    const b = nextCelebration(a, { type: 'hit', combo: 10 })
    expect(nextCelebration(b, { type: 'clear', id: a.milestone!.id })).toBe(b)
    expect(nextCelebration(b, { type: 'clear', id: b.milestone!.id }).milestone).toBeNull()
  })

  it('KR-09 a miss does not extend or change the burst', () => {
    const a = nextCelebration(INITIAL_CELEBRATION, { type: 'hit', combo: 5 })
    expect(nextCelebration(a, { type: 'miss' })).toBe(a)
  })

  it('KR-09 E2 finishing the game clears the burst', () => {
    const a = nextCelebration(INITIAL_CELEBRATION, { type: 'hit', combo: 5 })
    expect(nextCelebration(a, { type: 'finish' }).milestone).toBeNull()
  })

  it('KR-09 dropping back to 0 and reaching 5 again yields a new id', () => {
    const a = nextCelebration(INITIAL_CELEBRATION, { type: 'hit', combo: 5 })
    const cleared = nextCelebration(a, { type: 'clear', id: a.milestone!.id })
    const again = nextCelebration(cleared, { type: 'hit', combo: 5 })
    expect(again.milestone!.id).not.toBe(a.milestone!.id)
  })

  it('KR-09 praise key and burst duration', () => {
    expect(praiseKey(10)).toBe('comboPraise10')
    expect(praiseKey(50)).toBe('comboPraise50')
    expect(COMBO_BURST_MS).toBeLessThanOrEqual(1500)
  })
})
