import type { ChildProgress } from '@typing-adventure/game-engine'
import { apiClient } from './client'

export function getChildProgress() {
  return apiClient<ChildProgress>('/api/users/me/progress')
}

export function saveChildProgress(data: ChildProgress, replace = false) {
  return apiClient<ChildProgress>('/api/users/me/progress', {
    method: 'PUT',
    body: JSON.stringify({ data, replace }),
  })
}
