'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
  DEFAULT_DAILY_LIMIT,
  clampDailyLimit,
  grantBonusSession,
  markLittleSessionStarted,
  nextSticker,
} from '@typing-adventure/game-engine'
import type { DailyPlay, LetterProgress, Sticker } from '@typing-adventure/game-engine'

interface LittleData {
  progress: LetterProgress
  stickers: string[]
  daily: DailyPlay
  dailyLimit: number
  lastPraise: number | null
}

interface LittleActions {
  commitProgress: (progress: LetterProgress) => void
  addSticker: () => Sticker
  countSession: (today: string) => void
  grantBonus: (today: string) => void
  setDailyLimit: (n: number) => void
  setLastPraise: (i: number) => void
  resetProgress: () => void
}

const DEFAULTS: LittleData = {
  progress: {},
  stickers: [],
  daily: { date: '', sessions: 0, bonus: 0 },
  dailyLimit: DEFAULT_DAILY_LIMIT,
  lastPraise: null,
}

export const useLittleStore = create<LittleData & LittleActions>()(
  persist(
    (set, get) => ({
      ...DEFAULTS,
      commitProgress: (progress) => set({ progress }),
      addSticker: () => {
        const sticker = nextSticker(get().stickers.length)
        set({ stickers: [...get().stickers, sticker.emoji] })
        return sticker
      },
      countSession: (today) => set({ daily: markLittleSessionStarted(get().daily, today) }),
      grantBonus: (today) => set({ daily: grantBonusSession(get().daily, today) }),
      setDailyLimit: (n) => set({ dailyLimit: clampDailyLimit(n) }),
      setLastPraise: (i) => set({ lastPraise: i }),
      resetProgress: () => set({ progress: {}, stickers: [], lastPraise: null }),
    }),
    {
      name: 'typingAdventure_little',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ progress, stickers, daily, dailyLimit, lastPraise }) => ({
        progress, stickers, daily, dailyLimit, lastPraise,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<LittleData>
        return {
          ...current,
          progress: p.progress && typeof p.progress === 'object' ? p.progress : DEFAULTS.progress,
          stickers: Array.isArray(p.stickers) ? p.stickers : DEFAULTS.stickers,
          daily: p.daily && typeof p.daily.date === 'string'
            ? { ...DEFAULTS.daily, ...p.daily }
            : DEFAULTS.daily,
          dailyLimit: typeof p.dailyLimit === 'number' ? clampDailyLimit(p.dailyLimit) : DEFAULTS.dailyLimit,
          lastPraise: typeof p.lastPraise === 'number' ? p.lastPraise : null,
        }
      },
    },
  ),
)
