import { describe, expect, it } from 'vitest'
import {
  CHALLENGE_LIVES,
  CHALLENGE_MISTAKES_PER_LIFE,
  computeWordBoundaries,
  createInitialState,
  createStateFromCustomText,
} from '../engine'
import { LESSONS, WORDS } from '../words'

const words = (text: string) => text.split(' ')
const ALL = [...WORDS.easy, ...WORDS.medium, ...WORDS.hard]

describe('createInitialState word source', () => {
  it('classic picks wordCount words from the level list', () => {
    const state = createInitialState('classic', 'medium', 6)
    expect(words(state.text)).toHaveLength(6)
    for (const w of words(state.text)) expect(WORDS.medium).toContain(w)
    expect(new Set(words(state.text)).size).toBe(6)
  })

  it('defaults to 10 words', () => {
    expect(words(createInitialState('classic', 'easy').text)).toHaveLength(10)
  })

  it('timeAttack joins three picks of wordCount words', () => {
    const state = createInitialState('timeAttack', 'hard', 4, 0, 45)
    expect(words(state.text)).toHaveLength(12)
    for (const w of words(state.text)) expect(WORDS.hard).toContain(w)
    expect(state.text).not.toContain('  ')
    expect(state.timeRemaining).toBe(45)
  })

  it('custom words replace the level list in classic', () => {
    const custom = ['zebra', 'koala', 'llama', 'panda', 'otter']
    const state = createInitialState('classic', 'easy', 3, 0, 60, custom)
    expect(words(state.text)).toHaveLength(3)
    for (const w of words(state.text)) expect(custom).toContain(w)
  })

  it('custom words in timeAttack are picked three times', () => {
    const custom = ['zebra', 'koala', 'llama']
    const state = createInitialState('timeAttack', 'easy', 2, 0, 60, custom)
    expect(words(state.text)).toHaveLength(6)
    for (const w of words(state.text)) expect(custom).toContain(w)
  })

  it('custom words win over lesson and challenge modes', () => {
    const custom = ['zebra', 'koala']
    for (const mode of ['lesson', 'challenge'] as const) {
      const state = createInitialState(mode, 'easy', 2, 0, 60, custom)
      expect(words(state.text).sort()).toEqual(['koala', 'zebra'])
    }
  })

  it('an empty custom list falls back to the level list', () => {
    const state = createInitialState('classic', 'easy', 5, 0, 60, [])
    for (const w of words(state.text)) expect(WORDS.easy).toContain(w)
  })

  it('lesson mode with matching words stays on the lesson characters', () => {
    const state = createInitialState('lesson', 'easy', 5, 1)
    expect(words(state.text)).toHaveLength(5)
    expect(words(state.text)).toContain('top')
    const allowed = new Set(LESSONS[1].chars)
    for (const ch of state.text.replace(/ /g, '')) expect(allowed.has(ch)).toBe(true)
    for (const w of words(state.text)) expect(w.length).toBeGreaterThanOrEqual(3)
    for (const w of words(state.text)) expect(w.length).toBeLessThanOrEqual(6)
  })

  it('lesson mode without matching real words picks from all word lists', () => {
    const state = createInitialState('lesson', 'easy', 6, 0)
    expect(words(state.text)).toHaveLength(6)
    for (const w of words(state.text)) expect(ALL).toContain(w)
  })

  it('lesson mode falls back to the first lesson for an unknown index', () => {
    const state = createInitialState('lesson', 'easy', 6, 99)
    expect(words(state.text)).toHaveLength(6)
    for (const w of words(state.text)) expect(ALL).toContain(w)
    expect(state.lessonIndex).toBe(99)
  })

  it('challenge mode adds 10 extra words from all levels', () => {
    const state = createInitialState('challenge', 'easy', 5)
    expect(words(state.text)).toHaveLength(15)
    for (const w of words(state.text)) expect(ALL).toContain(w)
  })

  it('starts from a clean state with lives and no time outside timeAttack', () => {
    const state = createInitialState('classic', 'easy', 3, 2, 90)
    expect({ ...state, text: '', wordBoundaries: [] }).toEqual({
      text: '',
      currentIndex: 0,
      startTime: null,
      totalKeystrokes: 0,
      correctKeystrokes: 0,
      isFinished: false,
      level: 'easy',
      soundMode: 'default',
      gameMode: 'classic',
      wordBoundaries: [],
      combo: 0,
      maxCombo: 0,
      score: 0,
      mistakeMap: {},
      lives: CHALLENGE_LIVES,
      challengeMistakes: 0,
      wordsCompleted: 0,
      timeAttackDuration: 90,
      timeRemaining: 0,
      lessonIndex: 2,
    })
    expect(state.wordBoundaries).toEqual(computeWordBoundaries(state.text))
  })

  it('exposes the challenge constants', () => {
    expect(CHALLENGE_LIVES).toBe(3)
    expect(CHALLENGE_MISTAKES_PER_LIFE).toBe(3)
  })
})

describe('createStateFromCustomText', () => {
  it('lowercases, drops non-letters and collapses spaces', () => {
    const state = createStateFromCustomText('  Hello,   World 42\tBye!  ', 'hard')
    expect(state.text).toBe('hello world bye')
  })

  it('builds a classic state around the cleaned text', () => {
    const state = createStateFromCustomText('ab cd', 'medium')
    expect(state).toEqual({
      text: 'ab cd',
      currentIndex: 0,
      startTime: null,
      totalKeystrokes: 0,
      correctKeystrokes: 0,
      isFinished: false,
      level: 'medium',
      soundMode: 'default',
      gameMode: 'classic',
      wordBoundaries: [
        { word: 'ab', startIndex: 0, endIndex: 2 },
        { word: 'cd', startIndex: 3, endIndex: 5 },
      ],
      combo: 0,
      maxCombo: 0,
      score: 0,
      mistakeMap: {},
      lives: 3,
      challengeMistakes: 0,
      wordsCompleted: 0,
      timeAttackDuration: 0,
      timeRemaining: 0,
      lessonIndex: 0,
    })
  })
})
