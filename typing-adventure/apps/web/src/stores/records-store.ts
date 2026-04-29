'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Level, HistoryEntry, UserRecord } from '@typing-adventure/game-engine'

const MAX_HISTORY = 100

interface RecordsState {
  records: UserRecord
  history: HistoryEntry[]
  unlockedAchievements: string[]
}

interface RecordsActions {
  addHistory: (entry: HistoryEntry) => void
  updateRecords: (level: Level, wpm: number, accuracy: number, wordCount: number, score: number) => {
    isNewBestWpm: boolean
    isNewBestAcc: boolean
    isNewBestScore: boolean
  }
  unlockAchievements: (ids: string[]) => void
  clearAll: () => void
}

export type RecordsStore = RecordsState & RecordsActions

export const useRecordsStore = create<RecordsStore>()(
  persist(
    (set, get) => ({
      records: {
        bestWpm: { easy: 0, medium: 0, hard: 0 },
        bestAccuracy: { easy: 0, medium: 0, hard: 0 },
        bestScore: { easy: 0, medium: 0, hard: 0 },
        totalGames: 0,
        totalWords: 0,
        dayStreak: 0,
        lastPlayDate: null,
      },
      history: [],
      unlockedAchievements: [],

      addHistory: (entry) => {
        const { history } = get()
        const updated = [entry, ...history]
        if (updated.length > MAX_HISTORY) {
          updated.length = MAX_HISTORY
        }
        set({ history: updated })
      },

      updateRecords: (level, wpm, accuracy, wordCount, score) => {
        const { records } = get()
        const isNewBestWpm = wpm > (records.bestWpm[level] ?? 0)
        const isNewBestAcc = accuracy > (records.bestAccuracy[level] ?? 0)
        const isNewBestScore = score > (records.bestScore[level] ?? 0)

        const newRecords: UserRecord = {
          ...records,
          bestWpm: { ...records.bestWpm, ...(isNewBestWpm ? { [level]: wpm } : {}) },
          bestAccuracy: { ...records.bestAccuracy, ...(isNewBestAcc ? { [level]: accuracy } : {}) },
          bestScore: { ...records.bestScore, ...(isNewBestScore ? { [level]: score } : {}) },
          totalGames: records.totalGames + 1,
          totalWords: records.totalWords + wordCount,
          dayStreak: records.dayStreak,
          lastPlayDate: records.lastPlayDate,
        }

        const today = new Date().toISOString().slice(0, 10)
        if (newRecords.lastPlayDate !== today) {
          const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
          newRecords.dayStreak = newRecords.lastPlayDate === yesterday
            ? records.dayStreak + 1
            : 1
          newRecords.lastPlayDate = today
        }

        set({ records: newRecords })
        return { isNewBestWpm, isNewBestAcc, isNewBestScore }
      },

      unlockAchievements: (ids) => {
        const { unlockedAchievements } = get()
        set({ unlockedAchievements: [...unlockedAchievements, ...ids] })
      },

      clearAll: () => {
        set({
          records: {
            bestWpm: { easy: 0, medium: 0, hard: 0 },
            bestAccuracy: { easy: 0, medium: 0, hard: 0 },
            bestScore: { easy: 0, medium: 0, hard: 0 },
            totalGames: 0,
            totalWords: 0,
            dayStreak: 0,
            lastPlayDate: null,
          },
          history: [],
          unlockedAchievements: [],
        })
      },
    }),
    {
      name: 'typingAdventure_records',
    },
  ),
)
