'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { KeyboardCase, Level, SoundMode, SpeechRate, Theme, Lang } from '@typing-adventure/game-engine'

interface SettingsState {
  _hydrated: boolean
  keyboardCase: KeyboardCase
  level: Level
  soundMode: SoundMode
  soundEnabled: boolean
  speechRate: SpeechRate
  wordCount: number
  fingerGuide: boolean
  theme: Theme
  lang: Lang
  playerName: string
  playerAvatar: string
}

interface SettingsActions {
  setKeyboardCase: (value: KeyboardCase) => void
  setLevel: (value: Level) => void
  setSoundMode: (value: SoundMode) => void
  setSoundEnabled: (value: boolean) => void
  setSpeechRate: (value: SpeechRate) => void
  setWordCount: (value: number) => void
  setFingerGuide: (value: boolean) => void
  setTheme: (value: Theme) => void
  setLang: (value: Lang) => void
  setPlayerName: (value: string) => void
  setPlayerAvatar: (value: string) => void
}

export type SettingsStore = SettingsState & SettingsActions

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      _hydrated: false,
      keyboardCase: 'lower',
      level: 'easy',
      soundMode: 'default',
      soundEnabled: true,
      speechRate: 'normal',
      wordCount: 10,
      fingerGuide: true,
      theme: 'dark',
      lang: 'vi',
      playerName: '',
      playerAvatar: '🧒',

      setKeyboardCase: (value) => set({ keyboardCase: value }),
      setLevel: (value) => set({ level: value }),
      setSoundMode: (value) => set({ soundMode: value }),
      setSoundEnabled: (value) => set({ soundEnabled: value }),
      setSpeechRate: (value) => set({ speechRate: value }),
      setWordCount: (value) => set({ wordCount: value }),
      setFingerGuide: (value) => set({ fingerGuide: value }),
      setTheme: (value) => set({ theme: value }),
      setLang: (value) => set({ lang: value }),
      setPlayerName: (value) => set({ playerName: value }),
      setPlayerAvatar: (value) => set({ playerAvatar: value }),
    }),
    {
      name: 'typingAdventure_settings',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            state._hydrated = true
          }
        }
      },
    },
  ),
)
