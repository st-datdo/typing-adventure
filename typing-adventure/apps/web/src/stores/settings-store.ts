'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { KeyboardCase, Level, SoundMode, SpeechRate, Theme, Lang } from '@typing-adventure/game-engine'
import { updateProfile, updateSettings } from '@/lib/api/users'

interface SettingsState {
  _hydrated: boolean
  _isLoggedIn: boolean
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
  setIsLoggedIn: (value: boolean) => void
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
  loadFromServer: (profile: { name?: string | null; avatar?: string; settings?: Record<string, unknown> | null }) => void
  clearAll: () => void
}

export type SettingsStore = SettingsState & SettingsActions

const DEFAULTS: Omit<SettingsState, '_isLoggedIn'> = {
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
}

// Debounced DB sync for settings
let settingsSyncTimer: ReturnType<typeof setTimeout> | undefined
function syncSettingsToDB(data: Record<string, unknown>) {
  clearTimeout(settingsSyncTimer)
  settingsSyncTimer = setTimeout(() => { updateSettings(data) }, 300)
}

function syncProfileToDB(data: { name?: string; avatar?: string }) {
  updateProfile(data)
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ...DEFAULTS,
      _isLoggedIn: false,

      setIsLoggedIn: (value) => set({ _isLoggedIn: value }),

      setKeyboardCase: (value) => {
        set({ keyboardCase: value })
        if (get()._isLoggedIn) syncSettingsToDB({ keyboardCase: value })
      },
      setLevel: (value) => {
        set({ level: value })
        if (get()._isLoggedIn) syncSettingsToDB({ level: value })
      },
      setSoundMode: (value) => {
        set({ soundMode: value })
        if (get()._isLoggedIn) syncSettingsToDB({ soundMode: value })
      },
      setSoundEnabled: (value) => {
        set({ soundEnabled: value })
        if (get()._isLoggedIn) syncSettingsToDB({ soundEnabled: value })
      },
      setSpeechRate: (value) => {
        set({ speechRate: value })
        if (get()._isLoggedIn) syncSettingsToDB({ speechRate: value })
      },
      setWordCount: (value) => {
        set({ wordCount: value })
        if (get()._isLoggedIn) syncSettingsToDB({ wordCount: value })
      },
      setFingerGuide: (value) => {
        set({ fingerGuide: value })
        if (get()._isLoggedIn) syncSettingsToDB({ fingerGuide: value })
      },
      setTheme: (value) => {
        set({ theme: value })
        if (get()._isLoggedIn) syncSettingsToDB({ theme: value })
      },
      setLang: (value) => {
        set({ lang: value })
        if (get()._isLoggedIn) syncSettingsToDB({ lang: value })
      },
      setPlayerName: (value) => {
        set({ playerName: value })
        if (get()._isLoggedIn) syncProfileToDB({ name: value })
      },
      setPlayerAvatar: (value) => {
        set({ playerAvatar: value })
        if (get()._isLoggedIn) syncProfileToDB({ avatar: value })
      },

      loadFromServer: (profile) => {
        const s = (profile.settings ?? {}) as Record<string, unknown>
        set({
          playerName: profile.name ?? '',
          playerAvatar: profile.avatar ?? '🧒',
          ...(s.theme != null && { theme: s.theme as Theme }),
          ...(s.keyboardCase != null && { keyboardCase: s.keyboardCase as KeyboardCase }),
          ...(s.soundMode != null && { soundMode: s.soundMode as SoundMode }),
          ...(s.soundEnabled != null && { soundEnabled: s.soundEnabled as boolean }),
          ...(s.speechRate != null && { speechRate: s.speechRate as SpeechRate }),
          ...(s.wordCount != null && { wordCount: s.wordCount as number }),
          ...(s.fingerGuide != null && { fingerGuide: s.fingerGuide as boolean }),
          ...(s.lang != null && { lang: s.lang as Lang }),
        })
      },

      clearAll: () => {
        set({ ...DEFAULTS, _hydrated: true, _isLoggedIn: false })
      },
    }),
    {
      name: 'typingAdventure_settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        // Don't persist internal flags
        const { _hydrated, _isLoggedIn, ...rest } = state
        return rest
      },
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
