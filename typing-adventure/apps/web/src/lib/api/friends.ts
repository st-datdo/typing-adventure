import { apiClient } from './client'

export interface Friend {
  friendshipId: string
  id: string
  name: string | null
  avatar: string
  bestWpm: number
  totalGames: number
  lastPlayDate: string | null
}

export interface FriendRequest {
  friendshipId: string
  type: 'received' | 'sent'
  user: { id: string; name: string | null; avatar: string; email: string }
  createdAt: string
}

export function getFriends() {
  return apiClient<Friend[]>('/api/friends')
}

export function sendFriendRequest(data: { receiverId?: string; email?: string }) {
  return apiClient<{ id: string }>('/api/friends', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function acceptFriendRequest(friendshipId: string) {
  return apiClient<{ id: string }>(`/api/friends/${friendshipId}`, {
    method: 'PUT',
  })
}

export function removeFriend(friendshipId: string) {
  return apiClient<{ deleted: boolean }>(`/api/friends/${friendshipId}`, {
    method: 'DELETE',
  })
}

export function getFriendRequests() {
  return apiClient<{ received: FriendRequest[]; sent: FriendRequest[] }>(
    '/api/friends/requests',
  )
}
