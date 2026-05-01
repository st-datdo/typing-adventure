'use client'

import { create } from 'zustand'
import type { GameState, GameMode, Level, GameResult } from '@typing-adventure/game-engine'
import {
  createInitialState,
  createStateFromCustomText,
  processKeypress,
  calculateResult,
  isComboMilestone,
} from '@typing-adventure/game-engine'

interface GameStore {
  gameState: GameState
  isPlaying: boolean
  result: GameResult | null
  showCelebration: boolean
  customWords: string[] | undefined

  startGame: (mode: GameMode, level: Level, wordCount: number, lessonIndex?: number, timeAttackDuration?: number, customWords?: string[]) => void
  startCustomGame: (text: string, level: Level) => void
  handleKeypress: (char: string) => { isCorrect: boolean; completedWord: string | null; isMilestone: boolean }
  finishGame: () => void
  resetGame: () => void
  dismissCelebration: () => void
  setStartTime: (time: number) => void
  updateTimeRemaining: (remaining: number) => void
}

export const useGameStore = create<GameStore>()((set, get) => ({
  gameState: createInitialState('classic', 'easy', 10),
  isPlaying: false,
  result: null,
  showCelebration: false,
  customWords: undefined,

  startGame: (mode, level, wordCount, lessonIndex = 0, timeAttackDuration = 60, customWords = undefined) => {
    set({
      gameState: createInitialState(mode, level, wordCount, lessonIndex, timeAttackDuration, customWords),
      isPlaying: false,
      result: null,
      showCelebration: false,
      customWords,
    })
  },

  startCustomGame: (text, level) => {
    set({
      gameState: createStateFromCustomText(text, level),
      isPlaying: false,
      result: null,
      showCelebration: false,
    })
  },

  handleKeypress: (char) => {
    const { gameState } = get()
    if (gameState.isFinished) return { isCorrect: false, completedWord: null, isMilestone: false }

    const { newState, isCorrect, completedWord } = processKeypress(gameState, char)
    const isMilestone = isCorrect && isComboMilestone(newState.combo)

    set({ gameState: newState, isPlaying: true })

    if (newState.isFinished) {
      const elapsed = newState.startTime
        ? (Date.now() - newState.startTime) / 1000
        : 0
      const result = calculateResult(newState, elapsed)
      set({ result, showCelebration: true, isPlaying: false })
    }

    return { isCorrect, completedWord, isMilestone }
  },

  finishGame: () => {
    const { gameState } = get()
    const elapsed = gameState.startTime
      ? (Date.now() - gameState.startTime) / 1000
      : 0
    const result = calculateResult(gameState, elapsed)
    set({
      gameState: { ...gameState, isFinished: true },
      result,
      showCelebration: true,
      isPlaying: false,
    })
  },

  resetGame: () => {
    const { gameState, customWords } = get()
    set({
      gameState: createInitialState(
        gameState.gameMode,
        gameState.level,
        gameState.wordBoundaries.length || 10,
        gameState.lessonIndex,
        gameState.timeAttackDuration,
        customWords,
      ),
      isPlaying: false,
      result: null,
      showCelebration: false,
    })
  },

  dismissCelebration: () => set({ showCelebration: false }),

  setStartTime: (time) => {
    const { gameState } = get()
    if (gameState.startTime === null) {
      set({ gameState: { ...gameState, startTime: time } })
    }
  },

  updateTimeRemaining: (remaining) => {
    const { gameState } = get()
    set({ gameState: { ...gameState, timeRemaining: remaining } })
  },
}))
