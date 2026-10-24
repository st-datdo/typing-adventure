import type { Island, IslandView, LetterProgress } from './types'
import { MASTERY_FIRST_TRY } from './little-content'

export const ISLANDS: Island[] = [
  { id: 'sun', emoji: '☀️', letters: ['s', 'a', 't', 'p', 'i', 'n'] },
  { id: 'forest', emoji: '🌳', letters: ['m', 'd', 'g', 'o', 'c', 'k'] },
  { id: 'candy', emoji: '🍭', letters: ['e', 'u', 'r', 'h', 'b', 'f'] },
  { id: 'whale', emoji: '🐳', letters: ['l', 'j', 'v', 'w'] },
  { id: 'star', emoji: '⭐', letters: ['x', 'y', 'z', 'q'] },
]

function isMastered(progress: LetterProgress, letter: string): boolean {
  return (progress[letter]?.firstTry ?? 0) >= MASTERY_FIRST_TRY
}

export function getIslandViews(progress: LetterProgress): IslandView[] {
  let currentFound = false
  return ISLANDS.map(island => {
    const mastered = island.letters.filter(l => isMastered(progress, l))
    if (mastered.length === island.letters.length) return { island, mastered, status: 'done' as const }
    if (!currentFound) {
      currentFound = true
      return { island, mastered, status: 'current' as const }
    }
    return { island, mastered, status: 'locked' as const }
  })
}

export function countDoneIslands(progress: LetterProgress): number {
  return getIslandViews(progress).filter(v => v.status === 'done').length
}

export function getCurrentIsland(progress: LetterProgress): Island | null {
  return getIslandViews(progress).find(v => v.status === 'current')?.island ?? null
}

export function newlyReachedIsland(before: LetterProgress, after: LetterProgress): Island | null {
  if (countDoneIslands(after) <= countDoneIslands(before)) return null
  return getCurrentIsland(after) ?? ISLANDS[ISLANDS.length - 1]
}
