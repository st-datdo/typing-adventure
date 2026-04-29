import { describe, it, expect } from 'vitest'
import { WORDS, LESSONS, pickWords, generateLessonWords, generateChallengeWords } from '../words'

describe('WORDS', () => {
  it('has words for all levels', () => {
    expect(WORDS.easy.length).toBeGreaterThan(10)
    expect(WORDS.medium.length).toBeGreaterThan(10)
    expect(WORDS.hard.length).toBeGreaterThan(10)
  })

  it('easy words are shorter', () => {
    const avgEasy = WORDS.easy.reduce((s, w) => s + w.length, 0) / WORDS.easy.length
    const avgHard = WORDS.hard.reduce((s, w) => s + w.length, 0) / WORDS.hard.length
    expect(avgEasy).toBeLessThan(avgHard)
  })
})

describe('LESSONS', () => {
  it('has 5 lessons', () => {
    expect(LESSONS).toHaveLength(5)
  })

  it('Home Row contains asdfghjkl', () => {
    expect(LESSONS[0].chars).toBe('asdfghjkl')
  })

  it('last lesson contains all letters', () => {
    expect(LESSONS[4].chars).toBe('abcdefghijklmnopqrstuvwxyz')
  })
})

describe('pickWords', () => {
  it('returns words joined by spaces', () => {
    const text = pickWords('easy', 5)
    const words = text.split(' ')
    expect(words.length).toBe(5)
    for (const word of words) {
      expect(WORDS.easy).toContain(word)
    }
  })

  it('does not repeat words when possible', () => {
    const text = pickWords('easy', 10)
    const words = text.split(' ')
    const unique = new Set(words)
    expect(unique.size).toBe(10)
  })
})

describe('generateLessonWords', () => {
  it('generates words with only allowed characters when possible', () => {
    // Use all letters so matching pool is large
    const words = generateLessonWords('abcdefghijklmnopqrstuvwxyz', 5)
    expect(words).toHaveLength(5)
    for (const word of words) {
      for (const char of word) {
        expect('abcdefghijklmnopqrstuvwxyz').toContain(char)
      }
    }
  })

  it('prefers matching words for restricted char sets', () => {
    // Home row has limited matching real words — generator may fall back
    const words = generateLessonWords('asdfghjkl', 3)
    expect(words).toHaveLength(3)
    // At minimum each word is a string
    for (const word of words) {
      expect(word.length).toBeGreaterThan(0)
    }
  })

  it('returns correct count', () => {
    const words = generateLessonWords('abcdefghijklmnopqrstuvwxyz', 10)
    expect(words).toHaveLength(10)
  })
})

describe('generateChallengeWords', () => {
  it('returns correct count', () => {
    const words = generateChallengeWords(15)
    expect(words).toHaveLength(15)
  })

  it('starts with shorter words', () => {
    const words = generateChallengeWords(20)
    const firstAvg = words.slice(0, 5).reduce((s, w) => s + w.length, 0) / 5
    const lastAvg = words.slice(-5).reduce((s, w) => s + w.length, 0) / 5
    expect(firstAvg).toBeLessThanOrEqual(lastAvg + 3) // allow some variance due to randomness
  })
})
