import { describe, it, expect } from 'vitest'
import { createInitialState, processKeypress, calculateResult, computeWordBoundaries, formatTime } from '../engine'

describe('createInitialState', () => {
  it('creates classic mode state', () => {
    const state = createInitialState('classic', 'easy', 5)
    expect(state.gameMode).toBe('classic')
    expect(state.level).toBe('easy')
    expect(state.text.length).toBeGreaterThan(0)
    expect(state.currentIndex).toBe(0)
    expect(state.isFinished).toBe(false)
    expect(state.combo).toBe(0)
    expect(state.score).toBe(0)
    expect(state.lives).toBe(3)
  })

  it('creates timeAttack mode with extra words', () => {
    const state = createInitialState('timeAttack', 'easy', 5, 0, 30)
    expect(state.gameMode).toBe('timeAttack')
    expect(state.timeAttackDuration).toBe(30)
    expect(state.timeRemaining).toBe(30)
    // timeAttack generates 3x words
    const words = state.text.split(' ')
    expect(words.length).toBeGreaterThanOrEqual(5)
  })

  it('creates lesson mode', () => {
    const state = createInitialState('lesson', 'easy', 5, 0)
    expect(state.gameMode).toBe('lesson')
    expect(state.lessonIndex).toBe(0)
    expect(state.text.length).toBeGreaterThan(0)
    // Words are generated based on lesson chars
    const words = state.text.split(' ')
    expect(words.length).toBeGreaterThanOrEqual(1)
  })

  it('creates challenge mode', () => {
    const state = createInitialState('challenge', 'easy', 5)
    expect(state.gameMode).toBe('challenge')
    expect(state.lives).toBe(3)
  })
})

describe('processKeypress', () => {
  it('handles correct keypress', () => {
    const state = createInitialState('classic', 'easy', 3)
    const expected = state.text[0]
    const { newState, isCorrect } = processKeypress(state, expected)

    expect(isCorrect).toBe(true)
    expect(newState.currentIndex).toBe(1)
    expect(newState.correctKeystrokes).toBe(1)
    expect(newState.totalKeystrokes).toBe(1)
    expect(newState.combo).toBe(1)
    expect(newState.score).toBeGreaterThan(0)
  })

  it('handles wrong keypress', () => {
    const state = createInitialState('classic', 'easy', 3)
    const wrong = state.text[0] === 'a' ? 'b' : 'a'
    const { newState, isCorrect } = processKeypress(state, wrong)

    expect(isCorrect).toBe(false)
    expect(newState.currentIndex).toBe(0)
    expect(newState.correctKeystrokes).toBe(0)
    expect(newState.totalKeystrokes).toBe(1)
    expect(newState.combo).toBe(0)
  })

  it('resets combo on wrong keypress', () => {
    let state = createInitialState('classic', 'easy', 3)
    // Build combo
    for (let i = 0; i < 3 && i < state.text.length; i++) {
      const { newState } = processKeypress(state, state.text[i])
      state = newState
    }
    expect(state.combo).toBe(3)

    // Wrong keypress
    const wrong = state.text[state.currentIndex] === 'a' ? 'z' : 'a'
    const { newState } = processKeypress(state, wrong)
    expect(newState.combo).toBe(0)
    expect(newState.maxCombo).toBe(3)
  })

  it('tracks mistakes', () => {
    const state = createInitialState('classic', 'easy', 3)
    const expected = state.text[0]
    if (expected === ' ') return // skip if first char is space

    const wrong = expected === 'a' ? 'z' : 'a'
    const { newState } = processKeypress(state, wrong)
    expect(newState.mistakeMap[expected]).toBe(1)
  })

  it('finishes game when all chars typed', () => {
    let state = createInitialState('classic', 'easy', 1)
    for (let i = 0; i < state.text.length; i++) {
      const { newState } = processKeypress(state, state.text[i])
      state = newState
    }
    expect(state.isFinished).toBe(true)
  })

  it('loses life in challenge mode on mistakes', () => {
    let state = createInitialState('challenge', 'easy', 3)
    const wrong = state.text[0] === 'a' ? 'z' : 'a'

    // 3 mistakes = 1 life lost
    for (let i = 0; i < 3; i++) {
      const { newState } = processKeypress(state, wrong)
      state = newState
    }
    expect(state.lives).toBe(2)
  })
})

describe('computeWordBoundaries', () => {
  it('computes boundaries correctly', () => {
    const bounds = computeWordBoundaries('cat dog sun')
    expect(bounds).toEqual([
      { word: 'cat', startIndex: 0, endIndex: 3 },
      { word: 'dog', startIndex: 4, endIndex: 7 },
      { word: 'sun', startIndex: 8, endIndex: 11 },
    ])
  })
})

describe('calculateResult', () => {
  it('calculates result from state', () => {
    let state = createInitialState('classic', 'easy', 3)
    // Type all chars correctly
    for (let i = 0; i < state.text.length; i++) {
      const { newState } = processKeypress(state, state.text[i])
      state = newState
    }
    const result = calculateResult(state, 10)
    expect(result.accuracy).toBe(100)
    expect(result.wpm).toBeGreaterThan(0)
    expect(result.stars).toBeGreaterThanOrEqual(1)
    expect(result.score).toBeGreaterThan(0)
  })
})

describe('formatTime', () => {
  it('formats seconds to m:ss', () => {
    expect(formatTime(0)).toBe('0:00')
    expect(formatTime(5)).toBe('0:05')
    expect(formatTime(65)).toBe('1:05')
    expect(formatTime(125)).toBe('2:05')
  })
})
