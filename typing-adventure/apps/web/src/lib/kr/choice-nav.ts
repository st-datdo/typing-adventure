import { isModeAllowed } from '@typing-adventure/game-engine'
import type { AgeGroup, GameMode } from '@typing-adventure/game-engine'

export const ALL_MODES: GameMode[] = ['classic', 'lesson', 'timeAttack', 'challenge']

export function nextIndex(key: string, current: number, count: number): number | null {
  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
      return (current + 1) % count
    case 'ArrowLeft':
    case 'ArrowUp':
      return (current - 1 + count) % count
    case 'Home':
      return 0
    case 'End':
      return count - 1
    default:
      return null
  }
}

export function allowedModes(ageGroup: AgeGroup | null): GameMode[] {
  return ALL_MODES.filter((m) => isModeAllowed(ageGroup, m))
}
