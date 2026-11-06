import type { GameMode } from '@typing-adventure/game-engine'
import type { OwlMood } from '@/components/mascot/OwlMascot'

export interface ResultCelebration {
  mood: OwlMood
  clock: boolean
  confetti: boolean
}

export function resultCelebration({
  mode,
  lives,
  stars,
}: {
  mode: GameMode
  lives: number
  stars: number
}): ResultCelebration {
  if (mode === 'challenge' && lives <= 0)
    return { mood: 'encourage', clock: false, confetti: false }
  if (mode === 'timeAttack') {
    return stars >= 1
      ? { mood: 'happy', clock: true, confetti: true }
      : { mood: 'thinking', clock: true, confetti: false }
  }
  if (stars >= 3) return { mood: 'cheer', clock: false, confetti: true }
  if (stars >= 1) return { mood: 'happy', clock: false, confetti: true }
  return { mood: 'encourage', clock: false, confetti: false }
}

export const STAR_BASE_DELAY_MS = 300
export const STAR_STEP_MS = 220

export function starDelays(n: number): number[] {
  return Array.from({ length: n }, (_, i) => STAR_BASE_DELAY_MS + i * STAR_STEP_MS)
}
