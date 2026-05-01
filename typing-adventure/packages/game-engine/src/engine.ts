import type { GameState, GameMode, Level, WordBoundary, KeypressResult, GameResult } from './types'
import { calculateCharScore, calculateFinalScore, calculateStars, COMBO_MILESTONES } from './scoring'
import { WORDS, LESSONS, pickWords, pickWordsFromPool, generateLessonWords, generateChallengeWords } from './words'

const CHALLENGE_LIVES = 3
const CHALLENGE_MISTAKES_PER_LIFE = 3
const DEFAULT_WORD_COUNT = 10

export { CHALLENGE_LIVES, CHALLENGE_MISTAKES_PER_LIFE }

export function createInitialState(
  gameMode: GameMode,
  level: Level,
  wordCount: number = DEFAULT_WORD_COUNT,
  lessonIndex: number = 0,
  timeAttackDuration: number = 60,
  customWords?: string[],
): GameState {
  let text: string

  if (customWords && customWords.length > 0) {
    // Use custom word pack
    if (gameMode === 'timeAttack') {
      const w1 = pickWordsFromPool(customWords, wordCount)
      const w2 = pickWordsFromPool(customWords, wordCount)
      const w3 = pickWordsFromPool(customWords, wordCount)
      text = w1 + ' ' + w2 + ' ' + w3
    } else {
      text = pickWordsFromPool(customWords, wordCount)
    }
  } else if (gameMode === 'lesson') {
    const lesson = LESSONS[lessonIndex] ?? LESSONS[0]
    const words = generateLessonWords(lesson.chars, wordCount)
    text = words.join(' ')
  } else if (gameMode === 'timeAttack') {
    const w1 = pickWords(level, wordCount)
    const w2 = pickWords(level, wordCount)
    const w3 = pickWords(level, wordCount)
    text = w1 + ' ' + w2 + ' ' + w3
  } else if (gameMode === 'challenge') {
    const words = generateChallengeWords(wordCount + 10)
    text = words.join(' ')
  } else {
    text = pickWords(level, wordCount)
  }

  const wordBoundaries = computeWordBoundaries(text)

  return {
    text,
    currentIndex: 0,
    startTime: null,
    totalKeystrokes: 0,
    correctKeystrokes: 0,
    isFinished: false,
    level,
    soundMode: 'default',
    gameMode,
    wordBoundaries,
    combo: 0,
    maxCombo: 0,
    score: 0,
    mistakeMap: {},
    lives: CHALLENGE_LIVES,
    challengeMistakes: 0,
    wordsCompleted: 0,
    timeAttackDuration,
    timeRemaining: gameMode === 'timeAttack' ? timeAttackDuration : 0,
    lessonIndex,
  }
}

export function createStateFromCustomText(text: string, level: Level): GameState {
  const cleaned = text.trim().toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ')
  return {
    text: cleaned,
    currentIndex: 0,
    startTime: null,
    totalKeystrokes: 0,
    correctKeystrokes: 0,
    isFinished: false,
    level,
    soundMode: 'default',
    gameMode: 'classic',
    wordBoundaries: computeWordBoundaries(cleaned),
    combo: 0,
    maxCombo: 0,
    score: 0,
    mistakeMap: {},
    lives: CHALLENGE_LIVES,
    challengeMistakes: 0,
    wordsCompleted: 0,
    timeAttackDuration: 0,
    timeRemaining: 0,
    lessonIndex: 0,
  }
}

export function computeWordBoundaries(text: string): WordBoundary[] {
  const boundaries: WordBoundary[] = []
  let pos = 0
  for (const word of text.split(' ')) {
    boundaries.push({ word, startIndex: pos, endIndex: pos + word.length })
    pos += word.length + 1
  }
  return boundaries
}

export function processKeypress(state: GameState, inputChar: string): KeypressResult {
  if (state.isFinished) {
    return { newState: state, isCorrect: false, completedWord: null }
  }

  const expected = state.text[state.currentIndex]
  const newState: GameState = { ...state, totalKeystrokes: state.totalKeystrokes + 1 }
  let completedWord: string | null = null

  if (inputChar === expected) {
    newState.correctKeystrokes = state.correctKeystrokes + 1
    newState.combo = state.combo + 1
    if (newState.combo > state.maxCombo) {
      newState.maxCombo = newState.combo
    }

    newState.score = state.score + calculateCharScore(newState.combo)
    newState.currentIndex = state.currentIndex + 1

    completedWord = getCompletedWord(state.wordBoundaries, newState.currentIndex - 1)
    if (completedWord !== null) {
      newState.wordsCompleted = state.wordsCompleted + 1
    }

    if (newState.currentIndex >= state.text.length) {
      newState.isFinished = true
    }

    return { newState, isCorrect: true, completedWord }
  }

  // Wrong keypress
  newState.combo = 0
  if (expected !== ' ') {
    newState.mistakeMap = {
      ...state.mistakeMap,
      [expected]: (state.mistakeMap[expected] ?? 0) + 1,
    }
  }

  if (state.gameMode === 'challenge') {
    newState.challengeMistakes = state.challengeMistakes + 1
    if (newState.challengeMistakes >= CHALLENGE_MISTAKES_PER_LIFE) {
      newState.challengeMistakes = 0
      newState.lives = state.lives - 1
      if (newState.lives <= 0) {
        newState.isFinished = true
      }
    }
  }

  return { newState, isCorrect: false, completedWord: null }
}

function getCompletedWord(boundaries: WordBoundary[], charIndex: number): string | null {
  for (const b of boundaries) {
    if (charIndex === b.endIndex - 1) return b.word
    if (charIndex === b.endIndex) return b.word
  }
  return null
}

export function isComboMilestone(combo: number): boolean {
  return (COMBO_MILESTONES as readonly number[]).includes(combo)
}

export function calculateResult(state: GameState, elapsedSeconds: number): GameResult {
  const cps = elapsedSeconds > 0 ? state.correctKeystrokes / elapsedSeconds : 0
  const wpm = elapsedSeconds > 0
    ? Math.round((state.correctKeystrokes / 5) / (elapsedSeconds / 60))
    : 0
  const accuracy = state.totalKeystrokes > 0
    ? Math.round((state.correctKeystrokes / state.totalKeystrokes) * 100)
    : 100

  const finalScore = calculateFinalScore(state.score, accuracy)
  const stars = calculateStars(wpm, accuracy, state.level)

  return {
    wpm,
    cps: Number(cps.toFixed(2)),
    accuracy,
    score: finalScore,
    stars,
    timeSeconds: Number(elapsedSeconds.toFixed(1)),
    wordCount: state.wordBoundaries.length,
    maxCombo: state.maxCombo,
    mistakeMap: { ...state.mistakeMap },
  }
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
