import { describe, it, expect } from 'vitest'
import { emptyChildProgress, mergeChildProgress, normalizeChildProgress, sameChildProgress } from '../child-progress'
import { DEFAULT_DAILY_LIMIT, MAX_DAILY_LIMIT } from '../little-content'
import type { ChildProgress } from '../types'

function make(patch: Partial<ChildProgress['little']>, updatedAt = 1, games?: ChildProgress['games']): ChildProgress {
  const base = emptyChildProgress()
  return { little: { ...base.little, ...patch }, games: games ?? base.games, updatedAt }
}

describe('normalizeChildProgress', () => {
  it('returns an empty record for garbage', () => {
    expect(normalizeChildProgress(null)).toEqual(emptyChildProgress())
    expect(normalizeChildProgress('x')).toEqual(emptyChildProgress())
    expect(normalizeChildProgress([1, 2])).toEqual(emptyChildProgress())
  })

  it('drops unknown letters, bad numbers and caps firstTry by seen', () => {
    const out = normalizeChildProgress({
      little: {
        progress: { s: { seen: 2, firstTry: 9 }, '1': { seen: 4, firstTry: 4 }, a: { seen: -3, firstTry: 1 }, t: { seen: 'x' } },
      },
    })
    expect(out.little.progress).toEqual({ s: { seen: 2, firstTry: 2 } })
  })

  it('validates pet, daily, limit, stickers and games', () => {
    const out = normalizeChildProgress({
      little: {
        pet: { kind: 'dragon', days: 4 },
        daily: { date: 'yesterday', sessions: 2.7, bonus: -1 },
        dailyLimit: 99,
        stickers: ['🐱', 5, '', 'x'.repeat(40), '🐶'],
      },
      games: { best: { balloon: 3, chess: 9 }, plays: { picture: 4.2 } },
      updatedAt: 42,
    })
    expect(out.little.pet).toEqual({ kind: null, days: 0, lastDay: '' })
    expect(out.little.daily).toEqual({ date: '', sessions: 2, bonus: 0 })
    expect(out.little.dailyLimit).toBe(MAX_DAILY_LIMIT)
    expect(out.little.stickers).toEqual(['🐱', '🐶'])
    expect(out.games).toEqual({ best: { balloon: 3 }, plays: { picture: 4 } })
    expect(out.updatedAt).toBe(42)
  })

  it('keeps the default limit when missing', () => {
    expect(normalizeChildProgress({ little: {} }).little.dailyLimit).toBe(DEFAULT_DAILY_LIMIT)
  })
})

describe('mergeChildProgress', () => {
  it('takes the max of letter progress from both sides', () => {
    const a = make({ progress: { s: { seen: 5, firstTry: 1 } } })
    const b = make({ progress: { s: { seen: 2, firstTry: 2 }, a: { seen: 1, firstTry: 1 } } })
    expect(mergeChildProgress(a, b).little.progress).toEqual({
      s: { seen: 5, firstTry: 2 },
      a: { seen: 1, firstTry: 1 },
    })
  })

  it('keeps the longer sticker list', () => {
    const a = make({ stickers: ['🐱'] })
    const b = make({ stickers: ['🐱', '🐶'] })
    expect(mergeChildProgress(a, b).little.stickers).toEqual(['🐱', '🐶'])
    expect(mergeChildProgress(b, a).little.stickers).toEqual(['🐱', '🐶'])
  })

  it('merges daily play by date', () => {
    const a = make({ daily: { date: '2026-10-24', sessions: 1, bonus: 0 } })
    const b = make({ daily: { date: '2026-10-24', sessions: 2, bonus: 1 } })
    const c = make({ daily: { date: '2026-10-23', sessions: 5, bonus: 0 } })
    expect(mergeChildProgress(a, b).little.daily).toEqual({ date: '2026-10-24', sessions: 2, bonus: 1 })
    expect(mergeChildProgress(c, a).little.daily).toEqual({ date: '2026-10-24', sessions: 1, bonus: 0 })
  })

  it('takes the daily limit from the newer side', () => {
    const a = make({ dailyLimit: 4 }, 10)
    const b = make({ dailyLimit: 1 }, 20)
    expect(mergeChildProgress(a, b).little.dailyLimit).toBe(1)
    expect(mergeChildProgress(b, a).little.dailyLimit).toBe(1)
  })

  it('merges pets', () => {
    const none = make({})
    const kitty = make({ pet: { kind: 'kitty', days: 3, lastDay: '2026-10-20' } })
    const kitty2 = make({ pet: { kind: 'kitty', days: 2, lastDay: '2026-10-24' } })
    const dino = make({ pet: { kind: 'dino', days: 5, lastDay: '2026-10-21' } })
    expect(mergeChildProgress(none, kitty).little.pet.kind).toBe('kitty')
    expect(mergeChildProgress(kitty, kitty2).little.pet).toEqual({ kind: 'kitty', days: 3, lastDay: '2026-10-24' })
    expect(mergeChildProgress(kitty, dino).little.pet.kind).toBe('dino')
  })

  it('takes max game bests and plays', () => {
    const a = make({}, 1, { best: { balloon: 2 }, plays: { balloon: 7 } })
    const b = make({}, 1, { best: { balloon: 3, picture: 1 }, plays: { balloon: 4 } })
    expect(mergeChildProgress(a, b).games).toEqual({ best: { balloon: 3, picture: 1 }, plays: { balloon: 7 } })
  })

  it('is idempotent', () => {
    const a = make({ progress: { s: { seen: 3, firstTry: 2 } }, stickers: ['🐱'] }, 5)
    const once = mergeChildProgress(a, a)
    expect(sameChildProgress(once, a)).toBe(true)
    expect(mergeChildProgress(once, a)).toEqual(once)
  })
})

describe('sameChildProgress', () => {
  it('ignores updatedAt and key order', () => {
    const a = make({ progress: { s: { seen: 1, firstTry: 1 }, a: { seen: 1, firstTry: 0 } } }, 1)
    const b = make({ progress: { a: { seen: 1, firstTry: 0 }, s: { seen: 1, firstTry: 1 } } }, 99)
    expect(sameChildProgress(a, b)).toBe(true)
    expect(sameChildProgress(a, make({}, 1))).toBe(false)
  })
})
