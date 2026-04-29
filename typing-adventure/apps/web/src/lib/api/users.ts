import { apiClient } from './client'

interface UserProfile {
  id: string
  name: string | null
  email: string
  avatar: string
  settings: Record<string, unknown>
  role: string
  createdAt: string
  records: {
    bestWpm: Record<string, number>
    bestAccuracy: Record<string, number>
    bestScore: Record<string, number>
    totalGames: number
    totalWords: number
    dayStreak: number
    maxDayStreak: number
    lastPlayDate: string | null
  } | null
}

export function getProfile() {
  return apiClient<UserProfile>('/api/users/me')
}

export function updateProfile(data: { name?: string; avatar?: string }) {
  return apiClient<{ id: string; name: string; email: string; avatar: string }>(
    '/api/users/me',
    { method: 'PUT', body: JSON.stringify(data) },
  )
}

export function updateSettings(data: Record<string, unknown>) {
  return apiClient<Record<string, unknown>>('/api/users/me/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}
