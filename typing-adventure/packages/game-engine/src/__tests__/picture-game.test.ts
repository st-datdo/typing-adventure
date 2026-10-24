import { describe, it, expect } from 'vitest'
import {
  KID_PICTURE_WORDS,
  PICTURE_HINT_IDLE_MS,
  createPictureGame,
  getPictureWord,
  pictureKeypress,
  pictureStars,
  shouldShowPictureHint,
} from '../picture-game'

const pool = [
  { word: 'apple', emoji: '🍎' },
  { word: 'cat', emoji: '🐱' },
  { word: 'fish', emoji: '🐟' },
]

describe('KID_PICTURE_WORDS', () => {
  it('are unique lowercase a-z words', () => {
    const words = KID_PICTURE_WORDS.map(w => w.word)
    expect(new Set(words).size).toBe(words.length)
    for (const w of words) expect(w).toMatch(/^[a-z]{3,6}$/)
  })
})

describe('createPictureGame', () => {
  it('picks the requested count ordered short to long', () => {
    const s = createPictureGame(() => 0.5, 3, pool)
    expect(s.words.map(w => w.word)).toEqual(['cat', 'fish', 'apple'])
  })

  it('caps the size by the pool', () => {
    expect(createPictureGame(() => 0, 10, pool).words).toHaveLength(3)
  })
})

describe('pictureKeypress', () => {
  it('advances through a word and counts first-try words', () => {
    let s = createPictureGame(() => 0.5, 2, pool.slice(1))
    expect(getPictureWord(s)?.word).toBe('cat')
    for (const ch of 'ca') s = pictureKeypress(s, ch).state
    const r = pictureKeypress(s, 'T')
    expect(r.outcome).toBe('word')
    expect(r.state.firstTryWords).toBe(1)
    expect(getPictureWord(r.state)?.word).toBe('fish')
  })

  it('a wrong key keeps position and spoils first-try', () => {
    let s = createPictureGame(() => 0.5, 1, [{ word: 'cat', emoji: '🐱' }])
    const wrong = pictureKeypress(s, 'x')
    expect(wrong.outcome).toBe('wrong')
    expect(wrong.state.charIndex).toBe(0)
    s = wrong.state
    for (const ch of 'ca') s = pictureKeypress(s, ch).state
    const done = pictureKeypress(s, 't')
    expect(done.outcome).toBe('done')
    expect(done.state.finished).toBe(true)
    expect(done.state.firstTryWords).toBe(0)
  })

  it('ignores non-letters and input after finishing', () => {
    const s = createPictureGame(() => 0.5, 1, [{ word: 'cat', emoji: '🐱' }])
    expect(pictureKeypress(s, '1').outcome).toBe('ignored')
    expect(pictureKeypress({ ...s, finished: true }, 'c').outcome).toBe('ignored')
  })
})

describe('picture hints and stars', () => {
  it('shows a hint after idle time or repeated mistakes', () => {
    const s = createPictureGame(() => 0.5, 1, pool)
    expect(shouldShowPictureHint(s, 0)).toBe(false)
    expect(shouldShowPictureHint(s, PICTURE_HINT_IDLE_MS)).toBe(true)
    const twice = pictureKeypress(pictureKeypress(s, 'z').state, 'z').state
    expect(shouldShowPictureHint(twice, 0)).toBe(true)
  })

  it('a correct key clears the mistake counter', () => {
    const s = createPictureGame(() => 0.5, 1, [{ word: 'cat', emoji: '🐱' }])
    const after = pictureKeypress(pictureKeypress(pictureKeypress(s, 'z').state, 'z').state, 'c').state
    expect(shouldShowPictureHint(after, 0)).toBe(false)
  })

  it('stars by first-try ratio', () => {
    expect(pictureStars(8, 8)).toBe(3)
    expect(pictureStars(4, 8)).toBe(2)
    expect(pictureStars(1, 8)).toBe(1)
    expect(pictureStars(0, 0)).toBe(1)
  })
})
