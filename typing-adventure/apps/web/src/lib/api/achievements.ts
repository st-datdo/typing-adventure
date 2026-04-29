import { apiClient } from './client'
import type { HistoryEntry, UserRecord } from '@typing-adventure/game-engine'

interface AchievementStatus {
  id: string
  icon: string
  nameKey: string
  descKey: string
  unlocked: boolean
  unlockedAt: string | null
}

export function getAchievements() {
  return apiClient<AchievementStatus[]>('/api/achievements')
}

export function checkAchievementsApi(records: UserRecord, history: HistoryEntry[]) {
  return apiClient<{ newUnlocks: string[] }>('/api/achievements/check', {
    method: 'POST',
    body: JSON.stringify({ records, history }),
  })
}
