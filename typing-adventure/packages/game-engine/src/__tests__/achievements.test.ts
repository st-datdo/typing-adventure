import { describe, it, expect } from 'vitest'
import { ACHIEVEMENTS, checkAchievements } from '../achievements'
import type { UserRecord, HistoryEntry } from '../types'

function makeRecords(overrides: Partial<UserRecord> = {}): UserRecord {
  return {
    bestWpm: { easy: 0, medium: 0, hard: 0 },
    bestAccuracy: { easy: 0, medium: 0, hard: 0 },
    bestScore: { easy: 0, medium: 0, hard: 0 },
    totalGames: 0,
    totalWords: 0,
    dayStreak: 0,
    lastPlayDate: null,
    ...overrides,
  }
}

function makeHistory(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    date: '2026-04-29',
    level: 'easy',
    wpm: 30,
    cps: 2.5,
    accuracy: 90,
    time: 30,
    wordCount: 10,
    score: 500,
    stars: 2,
    maxCombo: 10,
    ...overrides,
  }
}

describe('ACHIEVEMENTS', () => {
  it('has 16 achievements', () => {
    expect(ACHIEVEMENTS).toHaveLength(16)
  })

  it('each achievement has required fields', () => {
    for (const ach of ACHIEVEMENTS) {
      expect(ach.id).toBeTruthy()
      expect(ach.icon).toBeTruthy()
      expect(ach.nameKey).toBeTruthy()
      expect(ach.descKey).toBeTruthy()
      expect(typeof ach.check).toBe('function')
    }
  })
})

describe('checkAchievements', () => {
  it('returns empty when no achievements earned', () => {
    const records = makeRecords()
    const result = checkAchievements(records, [], [])
    expect(result).toEqual([])
  })

  it('unlocks first_game after 1 game', () => {
    const records = makeRecords({ totalGames: 1 })
    const result = checkAchievements(records, [makeHistory()], [])
    expect(result).toContain('first_game')
  })

  it('does not re-unlock already unlocked achievements', () => {
    const records = makeRecords({ totalGames: 1 })
    const result = checkAchievements(records, [makeHistory()], ['first_game'])
    expect(result).not.toContain('first_game')
  })

  it('unlocks streak achievements', () => {
    const records = makeRecords({ dayStreak: 7 })
    const result = checkAchievements(records, [], [])
    expect(result).toContain('streak_3')
    expect(result).toContain('streak_7')
  })

  it('unlocks WPM achievements', () => {
    const records = makeRecords({ bestWpm: { easy: 45, medium: 0, hard: 0 } })
    const result = checkAchievements(records, [], [])
    expect(result).toContain('wpm_20')
    expect(result).toContain('wpm_40')
    expect(result).not.toContain('wpm_60')
  })

  it('unlocks perfect accuracy', () => {
    const history = [makeHistory({ accuracy: 100 })]
    const result = checkAchievements(makeRecords(), history, [])
    expect(result).toContain('perfect')
  })

  it('unlocks combo_50', () => {
    const history = [makeHistory({ maxCombo: 55 })]
    const result = checkAchievements(makeRecords(), history, [])
    expect(result).toContain('combo_50')
  })

  it('unlocks cps_5', () => {
    const history = [makeHistory({ cps: 5.5 })]
    const result = checkAchievements(makeRecords(), history, [])
    expect(result).toContain('cps_5')
  })

  it('unlocks three_star_all when all levels have 3 stars', () => {
    const history = [
      makeHistory({ level: 'easy', stars: 3 }),
      makeHistory({ level: 'medium', stars: 3 }),
      makeHistory({ level: 'hard', stars: 3 }),
    ]
    const result = checkAchievements(makeRecords(), history, [])
    expect(result).toContain('three_star_all')
  })
})
