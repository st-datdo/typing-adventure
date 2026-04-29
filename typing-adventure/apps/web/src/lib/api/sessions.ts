import { apiClient } from './client'
import type { GameSession } from '@typing-adventure/db'

interface SaveSessionData {
  gameMode: string
  level: string
  lessonIndex?: number
  wpm: number
  cps: number
  accuracy: number
  score: number
  stars: number
  timeSeconds: number
  wordCount: number
  maxCombo: number
  mistakeMap: Record<string, number>
}

export function saveSession(data: SaveSessionData) {
  return apiClient<{ session: GameSession; records: unknown }>('/api/sessions', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function getHistory(page = 1, limit = 20) {
  return apiClient<GameSession[]>(`/api/sessions?page=${page}&limit=${limit}`)
}

export function getStats() {
  return apiClient<{
    bestWpm: Record<string, number>
    bestAccuracy: Record<string, number>
    bestScore: Record<string, number>
    totalGames: number
    totalWords: number
    dayStreak: number
    maxDayStreak: number
    lastPlayDate: string | null
  }>('/api/sessions/stats')
}
