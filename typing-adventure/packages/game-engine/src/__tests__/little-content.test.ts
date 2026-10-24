import { describe, it, expect } from 'vitest'
import { LETTER_ORDER, LETTER_CARDS, PICTURE_WORDS, STICKERS } from '../little-content'
import { AGE_PROFILES, isModeAllowed } from '../age'

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('')

describe('LETTER_ORDER', () => {
  it('follows the phonics teaching order', () => {
    expect(LETTER_ORDER.join('')).toBe('satpinmdgockeurhbfljvwxyzq')
  })

  it('contains all 26 letters exactly once', () => {
    expect(new Set(LETTER_ORDER).size).toBe(26)
    expect([...LETTER_ORDER].sort()).toEqual(ALPHABET)
  })
})

describe('LETTER_CARDS', () => {
  it('has one card per letter', () => {
    expect(Object.keys(LETTER_CARDS).sort()).toEqual(ALPHABET)
  })

  it('every card word contains its letter', () => {
    for (const letter of ALPHABET) {
      expect(LETTER_CARDS[letter].letter).toBe(letter)
      expect(LETTER_CARDS[letter].word).toContain(letter)
      expect(LETTER_CARDS[letter].emoji.length).toBeGreaterThan(0)
    }
  })

  it('uses bear for b and fox for x', () => {
    expect(LETTER_CARDS.b).toEqual({ letter: 'b', word: 'bear', emoji: '🐻' })
    expect(LETTER_CARDS.x.word).toBe('fox')
  })
})

describe('PICTURE_WORDS', () => {
  it('are unique three-letter lowercase words', () => {
    const words = PICTURE_WORDS.map(p => p.word)
    expect(new Set(words).size).toBe(words.length)
    for (const w of words) expect(w).toMatch(/^[a-z]{3}$/)
  })

  it('includes cat, pin and ant', () => {
    const words = PICTURE_WORDS.map(p => p.word)
    expect(words).toEqual(expect.arrayContaining(['cat', 'pin', 'ant']))
  })
})

describe('STICKERS', () => {
  it('has 30 unique stickers', () => {
    expect(STICKERS).toHaveLength(30)
    expect(new Set(STICKERS.map(s => s.emoji)).size).toBe(30)
  })
})

describe('AGE_PROFILES', () => {
  it('kid only gets classic and lesson without speed stats or social', () => {
    expect(AGE_PROFILES.kid).toEqual({ allowedModes: ['classic', 'lesson'], showSpeedStats: false, social: false })
  })

  it('big gets every mode and social', () => {
    expect(AGE_PROFILES.big.allowedModes).toEqual(expect.arrayContaining(['classic', 'lesson', 'timeAttack', 'challenge']))
    expect(AGE_PROFILES.big.social).toBe(true)
    expect(AGE_PROFILES.big.showSpeedStats).toBe(true)
  })

  it('little has no regular modes', () => {
    expect(AGE_PROFILES.little.allowedModes).toEqual([])
  })
})

describe('isModeAllowed', () => {
  it('blocks time attack for kid', () => {
    expect(isModeAllowed('kid', 'timeAttack')).toBe(false)
  })

  it('allows everything when age is unknown', () => {
    expect(isModeAllowed(null, 'challenge')).toBe(true)
  })
})
