'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
  DEFAULT_DAILY_LIMIT,
  EMPTY_PET,
  choosePet,
  clampDailyLimit,
  feedPet,
  grantBonusSession,
  markLittleSessionStarted,
  nextSticker,
  normalizeChildProgress,
} from '@typing-adventure/game-engine'
import type { DailyPlay, LetterProgress, LittleSaved, PetKind, PetState, Sticker } from '@typing-adventure/game-engine'

interface LittleData {
  progress: LetterProgress
  stickers: string[]
  daily: DailyPlay
  dailyLimit: number
  pet: PetState
  lastPraise: number | null
  updatedAt: number
  owner: string | null
  needsReplace: boolean
}

interface LittleActions {
  commitProgress: (progress: LetterProgress) => void
  addSticker: () => Sticker
  countSession: (today: string) => void
  grantBonus: (today: string) => void
  setDailyLimit: (n: number) => void
  setLastPraise: (i: number) => void
  pickPet: (kind: PetKind) => void
  feedPet: (today: string) => { grew: boolean; hatched: boolean }
  resetProgress: () => void
  applySaved: (saved: LittleSaved, updatedAt: number) => void
  setOwner: (owner: string | null) => void
  clearNeedsReplace: () => void
}

const DEFAULTS: LittleData = {
  progress: {},
  stickers: [],
  daily: { date: '', sessions: 0, bonus: 0 },
  dailyLimit: DEFAULT_DAILY_LIMIT,
  pet: EMPTY_PET,
  lastPraise: null,
  updatedAt: 0,
  owner: null,
  needsReplace: false,
}

export const useLittleStore = create<LittleData & LittleActions>()(
  persist(
    (set, get) => ({
      ...DEFAULTS,
      commitProgress: (progress) => set({ progress, updatedAt: Date.now() }),
      addSticker: () => {
        const sticker = nextSticker(get().stickers.length)
        set({ stickers: [...get().stickers, sticker.emoji], updatedAt: Date.now() })
        return sticker
      },
      countSession: (today) => set({ daily: markLittleSessionStarted(get().daily, today), updatedAt: Date.now() }),
      grantBonus: (today) => set({ daily: grantBonusSession(get().daily, today), updatedAt: Date.now() }),
      setDailyLimit: (n) => set({ dailyLimit: clampDailyLimit(n), updatedAt: Date.now() }),
      setLastPraise: (i) => set({ lastPraise: i }),
      pickPet: (kind) => set({ pet: choosePet(get().pet, kind), updatedAt: Date.now() }),
      feedPet: (today) => {
        const result = feedPet(get().pet, today)
        if (result.pet !== get().pet) set({ pet: result.pet, updatedAt: Date.now() })
        return { grew: result.grew, hatched: result.hatched }
      },
      resetProgress: () => set({
        progress: {},
        stickers: [],
        lastPraise: null,
        updatedAt: Date.now(),
        needsReplace: true,
      }),
      applySaved: (saved, updatedAt) => set({
        progress: saved.progress,
        stickers: saved.stickers,
        daily: saved.daily,
        dailyLimit: saved.dailyLimit,
        pet: saved.pet,
        updatedAt,
      }),
      setOwner: (owner) => set({ owner }),
      clearNeedsReplace: () => set({ needsReplace: false }),
    }),
    {
      name: 'typingAdventure_little',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ progress, stickers, daily, dailyLimit, pet, lastPraise, updatedAt, owner, needsReplace }) => ({
        progress, stickers, daily, dailyLimit, pet, lastPraise, updatedAt, owner, needsReplace,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<LittleData>
        const saved = normalizeChildProgress({ little: p, updatedAt: p.updatedAt }).little
        return {
          ...current,
          progress: saved.progress,
          stickers: saved.stickers,
          daily: saved.daily,
          dailyLimit: saved.dailyLimit,
          pet: saved.pet,
          lastPraise: typeof p.lastPraise === 'number' ? p.lastPraise : null,
          updatedAt: typeof p.updatedAt === 'number' ? p.updatedAt : 0,
          owner: typeof p.owner === 'string' ? p.owner : null,
          needsReplace: p.needsReplace === true,
        }
      },
    },
  ),
)
