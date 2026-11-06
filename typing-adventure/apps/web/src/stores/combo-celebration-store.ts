'use client'

import { create } from 'zustand'
import {
  INITIAL_CELEBRATION,
  nextCelebration,
  type CelebrationState,
} from '@/lib/kr/combo-celebration'

interface ComboCelebrationStore extends CelebrationState {
  celebrate: (combo: number) => void
  clear: (id?: number) => void
  finish: () => void
}

export const useComboCelebrationStore = create<ComboCelebrationStore>()((set, get) => ({
  ...INITIAL_CELEBRATION,
  celebrate: (combo) => {
    const { milestone, seq } = get()
    const next = nextCelebration({ milestone, seq }, { type: 'hit', combo })
    if (next.milestone !== milestone) set(next)
  },
  clear: (id) => {
    const { milestone, seq } = get()
    if (!milestone) return
    const next =
      id === undefined
        ? { milestone: null, seq }
        : nextCelebration({ milestone, seq }, { type: 'clear', id })
    if (next.milestone !== milestone) set(next)
  },
  finish: () => {
    const { milestone, seq } = get()
    if (milestone) set(nextCelebration({ milestone, seq }, { type: 'finish' }))
  },
}))
