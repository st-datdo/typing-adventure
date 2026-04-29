import type { Level, LessonDef } from './types'

export const WORDS: Record<Level, string[]> = {
  easy: [
    'cat', 'dog', 'sun', 'hat', 'big', 'run', 'fun', 'red', 'top', 'box',
    'cup', 'map', 'pen', 'bed', 'hot', 'sit', 'let', 'cut', 'hop', 'win',
    'bat', 'fog', 'jam', 'kit', 'log', 'mud', 'net', 'pig', 'rug', 'van',
    'ant', 'bus', 'dig', 'egg', 'fix', 'gum', 'hug', 'ice', 'jet', 'kid',
  ],
  medium: [
    'apple', 'happy', 'tiger', 'robot', 'music', 'dance', 'cloud', 'dream',
    'light', 'beach', 'green', 'smile', 'stone', 'world', 'train', 'space',
    'plant', 'water', 'bread', 'house', 'mouse', 'heart', 'river', 'storm',
    'flame', 'piano', 'grape', 'candy', 'brave', 'quest', 'magic', 'knight',
  ],
  hard: [
    'butterfly', 'adventure', 'elephant', 'dinosaur', 'chocolate', 'beautiful',
    'wonderful', 'astronaut', 'celebrate', 'fantastic', 'pineapple', 'strawberry',
    'education', 'discovery', 'ecosystem', 'hamburger', 'invisible', 'knowledge',
    'landscape', 'nightmare', 'operation', 'passenger', 'questions', 'rectangle',
    'sunflower', 'telephone', 'umbrella', 'vegetable', 'xylophone', 'dangerous',
  ],
}

export const LESSONS: LessonDef[] = [
  { name: 'Home Row', chars: 'asdfghjkl' },
  { name: 'Top Row', chars: 'qwertyuiop' },
  { name: 'Bottom Row', chars: 'zxcvbnm' },
  { name: 'Home + Top', chars: 'asdfghjklqwertyuiop' },
  { name: 'All', chars: 'abcdefghijklmnopqrstuvwxyz' },
]

export function pickWords(level: Level, count: number): string {
  const pool = WORDS[level]
  const picked: string[] = []
  const used = new Set<number>()
  while (picked.length < count) {
    const idx = Math.floor(Math.random() * pool.length)
    if (!used.has(idx)) {
      used.add(idx)
      picked.push(pool[idx])
    }
    if (used.size >= pool.length) break
  }
  return picked.join(' ')
}

export function generateLessonWords(chars: string, count: number): string[] {
  const charArr = chars.split('')
  const allWords = [...WORDS.easy, ...WORDS.medium, ...WORDS.hard]
  const matching = allWords.filter(w =>
    [...w].every(ch => charArr.includes(ch))
  )
  const picked: string[] = []
  const used = new Set<number>()
  const pool = matching.length >= count ? matching : matching.length > 0 ? matching : allWords
  while (picked.length < count && used.size < pool.length) {
    const idx = Math.floor(Math.random() * pool.length)
    if (!used.has(idx)) {
      used.add(idx)
      picked.push(pool[idx])
    }
  }
  while (picked.length < count) {
    const len = 3 + Math.floor(Math.random() * 4)
    let word = ''
    for (let i = 0; i < len; i++) {
      word += charArr[Math.floor(Math.random() * charArr.length)]
    }
    picked.push(word)
  }
  return picked
}

export function generateChallengeWords(count: number): string[] {
  const all = [...WORDS.easy, ...WORDS.medium, ...WORDS.hard]
  const sorted = [...all].sort((a, b) => a.length - b.length)
  const picked: string[] = []
  for (let i = 0; i < count; i++) {
    const progress = i / count
    const rangeStart = Math.floor(progress * sorted.length * 0.5)
    const rangeEnd = Math.min(rangeStart + Math.ceil(sorted.length * 0.3), sorted.length)
    const idx = rangeStart + Math.floor(Math.random() * (rangeEnd - rangeStart))
    picked.push(sorted[Math.min(idx, sorted.length - 1)])
  }
  return picked
}
