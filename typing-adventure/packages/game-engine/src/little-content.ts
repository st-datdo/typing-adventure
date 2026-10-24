import type { LetterCard, PictureWord, Sticker } from './types'

export const LETTER_ORDER: string[] = 'satpinmdgockeurhbfljvwxyzq'.split('')

export const MASTERY_FIRST_TRY = 3
export const STAGE_COUNT = 3
export const ITEMS_PER_STAGE = 4
export const HINT_LEVEL_1_MS = 4000
export const HINT_LEVEL_2_MS = 8000
export const DEFAULT_DAILY_LIMIT = 2
export const MIN_DAILY_LIMIT = 1
export const MAX_DAILY_LIMIT = 5
export const PRAISE_COUNT = 6

const CARDS: [string, string, string][] = [
  ['a', 'apple', '🍎'],
  ['b', 'bear', '🐻'],
  ['c', 'cat', '🐱'],
  ['d', 'dog', '🐶'],
  ['e', 'egg', '🥚'],
  ['f', 'fish', '🐟'],
  ['g', 'grapes', '🍇'],
  ['h', 'hat', '🎩'],
  ['i', 'ice cream', '🍦'],
  ['j', 'juice', '🧃'],
  ['k', 'kite', '🪁'],
  ['l', 'lion', '🦁'],
  ['m', 'moon', '🌙'],
  ['n', 'nose', '👃'],
  ['o', 'orange', '🍊'],
  ['p', 'pig', '🐷'],
  ['q', 'queen', '👑'],
  ['r', 'rabbit', '🐰'],
  ['s', 'sun', '☀️'],
  ['t', 'tiger', '🐯'],
  ['u', 'umbrella', '☂️'],
  ['v', 'van', '🚐'],
  ['w', 'whale', '🐳'],
  ['x', 'fox', '🦊'],
  ['y', 'yo-yo', '🪀'],
  ['z', 'zebra', '🦓'],
]

export const LETTER_CARDS: Record<string, LetterCard> = Object.fromEntries(
  CARDS.map(([letter, word, emoji]) => [letter, { letter, word, emoji }]),
)

export const PICTURE_WORDS: PictureWord[] = [
  { word: 'cat', emoji: '🐱' },
  { word: 'dog', emoji: '🐶' },
  { word: 'sun', emoji: '☀️' },
  { word: 'hat', emoji: '🎩' },
  { word: 'pig', emoji: '🐷' },
  { word: 'bus', emoji: '🚌' },
  { word: 'cup', emoji: '🥤' },
  { word: 'bed', emoji: '🛏️' },
  { word: 'hen', emoji: '🐔' },
  { word: 'fox', emoji: '🦊' },
  { word: 'box', emoji: '📦' },
  { word: 'ant', emoji: '🐜' },
  { word: 'bat', emoji: '🦇' },
  { word: 'map', emoji: '🗺️' },
  { word: 'pan', emoji: '🍳' },
  { word: 'net', emoji: '🥅' },
  { word: 'pin', emoji: '📌' },
  { word: 'mop', emoji: '🧹' },
  { word: 'cow', emoji: '🐮' },
  { word: 'bee', emoji: '🐝' },
  { word: 'owl', emoji: '🦉' },
  { word: 'web', emoji: '🕸️' },
]

export const STICKERS: Sticker[] = [
  { emoji: '🐱', name: 'kitty' },
  { emoji: '🐶', name: 'puppy' },
  { emoji: '🐼', name: 'panda' },
  { emoji: '🦄', name: 'unicorn' },
  { emoji: '🐻', name: 'teddy bear' },
  { emoji: '🐸', name: 'frog' },
  { emoji: '🦋', name: 'butterfly' },
  { emoji: '🐰', name: 'bunny' },
  { emoji: '🦊', name: 'fox' },
  { emoji: '🐨', name: 'koala' },
  { emoji: '🐯', name: 'tiger' },
  { emoji: '🦁', name: 'lion' },
  { emoji: '🐮', name: 'cow' },
  { emoji: '🐷', name: 'piggy' },
  { emoji: '🐵', name: 'monkey' },
  { emoji: '🐧', name: 'penguin' },
  { emoji: '🐥', name: 'chick' },
  { emoji: '🐢', name: 'turtle' },
  { emoji: '🐙', name: 'octopus' },
  { emoji: '🐳', name: 'whale' },
  { emoji: '🐬', name: 'dolphin' },
  { emoji: '🦕', name: 'dinosaur' },
  { emoji: '🐝', name: 'bee' },
  { emoji: '🐞', name: 'ladybug' },
  { emoji: '🌈', name: 'rainbow' },
  { emoji: '⭐', name: 'star' },
  { emoji: '🚀', name: 'rocket' },
  { emoji: '🎈', name: 'balloon' },
  { emoji: '🍓', name: 'strawberry' },
  { emoji: '🧁', name: 'cupcake' },
]
