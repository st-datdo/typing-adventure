'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { normalizeChildProgress } from '@typing-adventure/game-engine'
import type { GamesSaved, MiniGameId } from '@typing-adventure/game-engine'

interface GamesData {
  best: GamesSaved['best']
  plays: GamesSaved['plays']
  updatedAt: number
}

interface GamesActions {
  recordResult: (id: MiniGameId, stars: number) => { newBest: boolean }
  applySaved: (saved: GamesSaved, updatedAt: number) => void
}

export const useGamesStore = create<GamesData & GamesActions>()(
  persist(
    (set, get) => ({
      best: {},
      plays: {},
      updatedAt: 0,
      recordResult: (id, stars) => {
        const { best, plays } = get()
        const previous = best[id] ?? 0
        const newBest = stars > previous
        set({
          best: newBest ? { ...best, [id]: stars } : best,
          plays: { ...plays, [id]: (plays[id] ?? 0) + 1 },
          updatedAt: Date.now(),
        })
        return { newBest: newBest && previous > 0 }
      },
      applySaved: (saved, updatedAt) => set({ best: saved.best, plays: saved.plays, updatedAt }),
    }),
    {
      name: 'typingAdventure_games',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ best, plays, updatedAt }) => ({ best, plays, updatedAt }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<GamesData>
        const saved = normalizeChildProgress({ games: p }).games
        return {
          ...current,
          best: saved.best,
          plays: saved.plays,
          updatedAt: typeof p.updatedAt === 'number' ? p.updatedAt : 0,
        }
      },
    },
  ),
)
