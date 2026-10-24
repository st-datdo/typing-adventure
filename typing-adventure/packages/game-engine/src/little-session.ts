import type { LetterProgress, LittleItem, LittleSession } from './types'
import { LETTER_ORDER, LETTER_CARDS, PICTURE_WORDS, MASTERY_FIRST_TRY, ITEMS_PER_STAGE } from './little-content'

const LEARNING_SIZE = 2
const WORDS_IN_LAST_STAGE = 2

export function getMasteredLetters(progress: LetterProgress): string[] {
  return LETTER_ORDER.filter(l => (progress[l]?.firstTry ?? 0) >= MASTERY_FIRST_TRY)
}

export function getLearningLetters(progress: LetterProgress): string[] {
  return LETTER_ORDER.filter(l => (progress[l]?.firstTry ?? 0) < MASTERY_FIRST_TRY).slice(0, LEARNING_SIZE)
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function pickCycling<T>(pool: T[], count: number, rng: () => number): T[] {
  const out: T[] = []
  while (out.length < count) {
    out.push(...shuffle(pool, rng).slice(0, count - out.length))
  }
  return out
}

function letterItem(letter: string): LittleItem {
  return { kind: 'letter', target: letter, card: LETTER_CARDS[letter] }
}

function arrange(items: LittleItem[], prevTarget: string | null, rng: () => number): LittleItem[] {
  const remaining = shuffle(items, rng)
  const out: LittleItem[] = []
  let prev = prevTarget
  while (remaining.length > 0) {
    const counts = new Map<string, number>()
    for (const item of remaining) counts.set(item.target, (counts.get(item.target) ?? 0) + 1)
    let best = -1
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].target === prev) continue
      if (best === -1 || counts.get(remaining[i].target)! > counts.get(remaining[best].target)!) best = i
    }
    const [chosen] = remaining.splice(best === -1 ? 0 : best, 1)
    out.push(chosen)
    prev = chosen.target
  }
  return out
}

export function buildLittleSession(progress: LetterProgress, rng: () => number): LittleSession {
  const mastered = getMasteredLetters(progress)
  const learning = getLearningLetters(progress)
  const review = LETTER_ORDER.filter(
    l => !learning.includes(l) && (mastered.includes(l) || (progress[l]?.seen ?? 0) > 0),
  )

  const stage1Pool = review.length > 0 ? review : learning
  const stage1 = pickCycling(stage1Pool, ITEMS_PER_STAGE, rng).map(letterItem)

  let stage2Letters: string[]
  if (learning.length >= 2) {
    stage2Letters = [learning[0], learning[0], learning[1], learning[1]]
  } else if (learning.length === 1) {
    const filler = review.length > 0 ? pickCycling(review, 2, rng) : [learning[0], learning[0]]
    stage2Letters = [learning[0], learning[0], ...filler]
  } else {
    stage2Letters = pickCycling(mastered, ITEMS_PER_STAGE, rng)
  }
  const stage2 = stage2Letters.map(letterItem)

  const letterPool = [...learning, ...review]
  const mixPool = letterPool.length > 0 ? letterPool : mastered
  const words = PICTURE_WORDS.filter(p => [...p.word].every(ch => mastered.includes(ch)))
  let stage3: LittleItem[]
  if (words.length >= WORDS_IN_LAST_STAGE) {
    const pickedWords = shuffle(words, rng).slice(0, WORDS_IN_LAST_STAGE)
    stage3 = [
      ...pickedWords.map((p): LittleItem => ({ kind: 'word', target: p.word, picture: p })),
      ...pickCycling(mixPool, ITEMS_PER_STAGE - WORDS_IN_LAST_STAGE, rng).map(letterItem),
    ]
  } else {
    stage3 = pickCycling(mixPool, ITEMS_PER_STAGE, rng).map(letterItem)
  }

  const stages: LittleItem[][] = []
  let prev: string | null = null
  for (const stage of [stage1, stage2, stage3]) {
    const arranged = arrange(stage, prev, rng)
    stages.push(arranged)
    prev = arranged[arranged.length - 1].target
  }
  return { stages }
}
