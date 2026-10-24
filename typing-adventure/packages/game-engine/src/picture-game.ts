import type { PictureWord } from './types'

export const KID_PICTURE_WORDS: PictureWord[] = [
  { word: 'cat', emoji: '🐱' },
  { word: 'dog', emoji: '🐶' },
  { word: 'sun', emoji: '☀️' },
  { word: 'hat', emoji: '🎩' },
  { word: 'pig', emoji: '🐷' },
  { word: 'bus', emoji: '🚌' },
  { word: 'bee', emoji: '🐝' },
  { word: 'egg', emoji: '🥚' },
  { word: 'fox', emoji: '🦊' },
  { word: 'owl', emoji: '🦉' },
  { word: 'cow', emoji: '🐮' },
  { word: 'ant', emoji: '🐜' },
  { word: 'key', emoji: '🔑' },
  { word: 'car', emoji: '🚗' },
  { word: 'bird', emoji: '🐦' },
  { word: 'fish', emoji: '🐟' },
  { word: 'frog', emoji: '🐸' },
  { word: 'duck', emoji: '🦆' },
  { word: 'bear', emoji: '🐻' },
  { word: 'lion', emoji: '🦁' },
  { word: 'cake', emoji: '🎂' },
  { word: 'ball', emoji: '⚽' },
  { word: 'book', emoji: '📖' },
  { word: 'boat', emoji: '⛵' },
  { word: 'kite', emoji: '🪁' },
  { word: 'milk', emoji: '🥛' },
  { word: 'moon', emoji: '🌙' },
  { word: 'star', emoji: '⭐' },
  { word: 'tree', emoji: '🌳' },
  { word: 'shoe', emoji: '👟' },
  { word: 'bell', emoji: '🔔' },
  { word: 'rose', emoji: '🌹' },
  { word: 'apple', emoji: '🍎' },
  { word: 'horse', emoji: '🐴' },
  { word: 'house', emoji: '🏠' },
  { word: 'mouse', emoji: '🐭' },
  { word: 'snake', emoji: '🐍' },
  { word: 'pizza', emoji: '🍕' },
  { word: 'robot', emoji: '🤖' },
  { word: 'train', emoji: '🚂' },
  { word: 'panda', emoji: '🐼' },
  { word: 'clock', emoji: '⏰' },
  { word: 'cookie', emoji: '🍪' },
  { word: 'rabbit', emoji: '🐰' },
  { word: 'banana', emoji: '🍌' },
]

export const PICTURE_ROUND_SIZE = 8
export const PICTURE_HINT_IDLE_MS = 5000
export const PICTURE_HINT_MISTAKES = 2

export type PictureOutcome = 'ignored' | 'wrong' | 'char' | 'word' | 'done'

export interface PictureGameState {
  words: PictureWord[]
  wordIndex: number
  charIndex: number
  mistakesInChar: number
  wordHadMistake: boolean
  firstTryWords: number
  finished: boolean
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function createPictureGame(
  rng: () => number,
  size = PICTURE_ROUND_SIZE,
  pool: PictureWord[] = KID_PICTURE_WORDS,
): PictureGameState {
  const words = shuffle(pool, rng)
    .slice(0, Math.max(0, Math.min(size, pool.length)))
    .map((w, i) => ({ w, i }))
    .sort((a, b) => a.w.word.length - b.w.word.length || a.i - b.i)
    .map(({ w }) => w)
  return {
    words,
    wordIndex: 0,
    charIndex: 0,
    mistakesInChar: 0,
    wordHadMistake: false,
    firstTryWords: 0,
    finished: words.length === 0,
  }
}

export function getPictureWord(state: PictureGameState): PictureWord | null {
  if (state.finished) return null
  return state.words[state.wordIndex] ?? null
}

export function pictureKeypress(state: PictureGameState, char: string): { state: PictureGameState; outcome: PictureOutcome } {
  const ch = char.toLowerCase()
  const current = getPictureWord(state)
  if (!current || !/^[a-z]$/.test(ch)) return { state, outcome: 'ignored' }
  const expected = current.word[state.charIndex]

  if (ch !== expected) {
    return {
      state: { ...state, mistakesInChar: state.mistakesInChar + 1, wordHadMistake: true },
      outcome: 'wrong',
    }
  }

  if (state.charIndex + 1 < current.word.length) {
    return { state: { ...state, charIndex: state.charIndex + 1, mistakesInChar: 0 }, outcome: 'char' }
  }

  const firstTryWords = state.firstTryWords + (state.wordHadMistake ? 0 : 1)
  const wordIndex = state.wordIndex + 1
  const finished = wordIndex >= state.words.length
  return {
    state: {
      ...state,
      wordIndex,
      charIndex: 0,
      mistakesInChar: 0,
      wordHadMistake: false,
      firstTryWords,
      finished,
    },
    outcome: finished ? 'done' : 'word',
  }
}

export function shouldShowPictureHint(state: PictureGameState, idleMs: number): boolean {
  return state.mistakesInChar >= PICTURE_HINT_MISTAKES || idleMs >= PICTURE_HINT_IDLE_MS
}

export function pictureStars(firstTryWords: number, total: number): 1 | 2 | 3 {
  if (total <= 0) return 1
  const ratio = firstTryWords / total
  if (ratio >= 0.85) return 3
  if (ratio >= 0.5) return 2
  return 1
}
