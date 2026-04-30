import { apiClient } from './client'

interface LeaderboardEntry {
  rank: number
  userId: string
  name: string
  avatar: string
  wpm: number
  accuracy: number
  score: number
  isMe?: boolean
}

interface LeaderboardParams {
  mode?: string
  level?: string
  period?: string
  limit?: number
  offset?: number
}

export function getLeaderboard(params: LeaderboardParams = {}) {
  const search = new URLSearchParams()
  if (params.mode) search.set('mode', params.mode)
  if (params.level) search.set('level', params.level)
  if (params.period) search.set('period', params.period)
  if (params.limit) search.set('limit', String(params.limit))
  if (params.offset) search.set('offset', String(params.offset))
  return apiClient<LeaderboardEntry[]>(`/api/leaderboard?${search}`)
}

export function getFriendsLeaderboard(params: { mode?: string; level?: string } = {}) {
  const search = new URLSearchParams()
  if (params.mode) search.set('mode', params.mode)
  if (params.level) search.set('level', params.level)
  return apiClient<LeaderboardEntry[]>(`/api/leaderboard/friends?${search}`)
}
