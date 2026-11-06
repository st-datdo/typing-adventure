import { COMBO_MILESTONES } from '@typing-adventure/game-engine'
import type { TranslationKey } from '@typing-adventure/i18n'

export const COMBO_BURST_MS = 1200

export interface Milestone {
  value: number
  id: number
}

export interface CelebrationState {
  milestone: Milestone | null
  seq: number
}

export type CelebrationEvent =
  | { type: 'hit'; combo: number }
  | { type: 'miss' }
  | { type: 'clear'; id: number }
  | { type: 'finish' }

export const INITIAL_CELEBRATION: CelebrationState = { milestone: null, seq: 0 }

const isMilestone = (n: number) => (COMBO_MILESTONES as readonly number[]).includes(n)

export function nextCelebration(prev: CelebrationState, event: CelebrationEvent): CelebrationState {
  switch (event.type) {
    case 'hit': {
      if (!isMilestone(event.combo)) return prev
      const seq = prev.seq + 1
      return { milestone: { value: event.combo, id: seq }, seq }
    }
    case 'clear':
      if (!prev.milestone || prev.milestone.id !== event.id) return prev
      return { ...prev, milestone: null }
    case 'finish':
      return prev.milestone ? { ...prev, milestone: null } : prev
    default:
      return prev
  }
}

export function praiseKey(value: number): TranslationKey {
  return `comboPraise${value}` as TranslationKey
}
