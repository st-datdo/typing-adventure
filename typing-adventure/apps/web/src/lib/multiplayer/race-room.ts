import type { RoomState, RoomPlayer, RaceResultData } from './types'
import { playerToDTO } from './types'

const rooms = new Map<string, RoomState>()
const codeToRoomId = new Map<string, string>()
const userToRoomId = new Map<string, string>()

const MAX_PLAYERS = 4
const ROOM_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes
const RACE_TIMEOUT_MS = 60 * 1000 // 60s after first finish

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

function generateId(): string {
  return `room_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function createRoom(hostUserId: string, hostName: string, hostAvatar: string, level: string, text: string): RoomState {
  // Remove user from any existing room
  leaveRoom(hostUserId)

  const roomId = generateId()
  let code = generateCode()
  while (codeToRoomId.has(code)) {
    code = generateCode()
  }

  const player: RoomPlayer = {
    userId: hostUserId,
    name: hostName,
    avatar: hostAvatar,
    ready: false,
    currentIndex: 0,
    wpm: 0,
    accuracy: 100,
    finished: false,
    finishTime: null,
    rank: null,
    disconnected: false,
  }

  const room: RoomState = {
    roomId,
    code,
    hostUserId,
    level,
    text,
    status: 'WAITING',
    maxPlayers: MAX_PLAYERS,
    players: new Map([[hostUserId, player]]),
    createdAt: Date.now(),
    startedAt: null,
    lastActivityAt: Date.now(),
  }

  rooms.set(roomId, room)
  codeToRoomId.set(code, roomId)
  userToRoomId.set(hostUserId, roomId)

  return room
}

export function joinRoom(code: string, userId: string, name: string, avatar: string): { room: RoomState | null; error?: string } {
  const roomId = codeToRoomId.get(code.toUpperCase())
  if (!roomId) return { room: null, error: 'Room not found' }

  const room = rooms.get(roomId)
  if (!room) return { room: null, error: 'Room not found' }

  if (room.status !== 'WAITING') return { room: null, error: 'Race already started' }
  if (room.players.size >= room.maxPlayers) return { room: null, error: 'Room is full' }

  // Check if user already in room (reconnect)
  const existingPlayer = room.players.get(userId)
  if (existingPlayer) {
    existingPlayer.disconnected = false
    room.lastActivityAt = Date.now()
    return { room }
  }

  // Remove from previous room
  leaveRoom(userId)

  const player: RoomPlayer = {
    userId,
    name,
    avatar,
    ready: false,
    currentIndex: 0,
    wpm: 0,
    accuracy: 100,
    finished: false,
    finishTime: null,
    rank: null,
    disconnected: false,
  }

  room.players.set(userId, player)
  userToRoomId.set(userId, roomId)
  room.lastActivityAt = Date.now()

  return { room }
}

export function setPlayerReady(roomId: string, userId: string): { allReady: boolean; readyPlayers: string[] } | null {
  const room = rooms.get(roomId)
  if (!room || room.status !== 'WAITING') return null

  const player = room.players.get(userId)
  if (!player) return null

  player.ready = true
  room.lastActivityAt = Date.now()

  const readyPlayers = [...room.players.values()].filter((p) => p.ready).map((p) => p.userId)
  const allReady = readyPlayers.length === room.players.size && room.players.size >= 2

  return { allReady, readyPlayers }
}

export function startCountdown(roomId: string): boolean {
  const room = rooms.get(roomId)
  if (!room || room.status !== 'WAITING') return false

  room.status = 'COUNTDOWN'
  room.lastActivityAt = Date.now()
  return true
}

export function startRace(roomId: string): RoomState | null {
  const room = rooms.get(roomId)
  if (!room || room.status !== 'COUNTDOWN') return null

  room.status = 'RACING'
  room.startedAt = Date.now()
  room.lastActivityAt = Date.now()

  // Reset all players
  for (const player of room.players.values()) {
    player.currentIndex = 0
    player.wpm = 0
    player.accuracy = 100
    player.finished = false
    player.finishTime = null
    player.rank = null
  }

  return room
}

export function updateProgress(roomId: string, userId: string, currentIndex: number, wpm: number, accuracy: number): RoomPlayer | null {
  const room = rooms.get(roomId)
  if (!room || room.status !== 'RACING') return null

  const player = room.players.get(userId)
  if (!player || player.finished) return null

  player.currentIndex = currentIndex
  player.wpm = wpm
  player.accuracy = accuracy
  room.lastActivityAt = Date.now()

  return player
}

export function playerFinish(roomId: string, userId: string, wpm: number, accuracy: number, timeSeconds: number): { player: RoomPlayer; allFinished: boolean } | null {
  const room = rooms.get(roomId)
  if (!room || room.status !== 'RACING') return null

  const player = room.players.get(userId)
  if (!player || player.finished) return null

  player.finished = true
  player.wpm = wpm
  player.accuracy = accuracy
  player.finishTime = timeSeconds
  player.currentIndex = room.text.length

  // Calculate rank
  const finishedPlayers = [...room.players.values()].filter((p) => p.finished)
  player.rank = finishedPlayers.length

  const activePlayers = [...room.players.values()].filter((p) => !p.disconnected)
  const allFinished = activePlayers.every((p) => p.finished)

  room.lastActivityAt = Date.now()

  return { player, allFinished }
}

export function endRace(roomId: string): RaceResultData[] | null {
  const room = rooms.get(roomId)
  if (!room) return null

  room.status = 'FINISHED'

  // Assign ranks to unfinished players
  const finished = [...room.players.values()].filter((p) => p.finished).sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999))
  const unfinished = [...room.players.values()].filter((p) => !p.finished)
  let nextRank = finished.length + 1
  for (const p of unfinished) {
    p.rank = nextRank++
    p.finished = true
  }

  const results: RaceResultData[] = [...room.players.values()]
    .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999))
    .map((p) => ({
      userId: p.userId,
      wpm: p.wpm,
      accuracy: p.accuracy,
      position: p.rank ?? 999,
      finishTime: p.finishTime,
    }))

  return results
}

export function leaveRoom(userId: string): { roomId: string; isEmpty: boolean; newHostId?: string } | null {
  const roomId = userToRoomId.get(userId)
  if (!roomId) return null

  const room = rooms.get(roomId)
  if (!room) {
    userToRoomId.delete(userId)
    return null
  }

  room.players.delete(userId)
  userToRoomId.delete(userId)
  room.lastActivityAt = Date.now()

  if (room.players.size === 0) {
    closeRoom(roomId)
    return { roomId, isEmpty: true }
  }

  // Transfer host if host left
  let newHostId: string | undefined
  if (room.hostUserId === userId) {
    const nextPlayer = [...room.players.values()].find((p) => !p.disconnected)
    if (nextPlayer) {
      room.hostUserId = nextPlayer.userId
      newHostId = nextPlayer.userId
    }
  }

  return { roomId, isEmpty: false, newHostId }
}

export function markDisconnected(userId: string): { roomId: string; room: RoomState } | null {
  const roomId = userToRoomId.get(userId)
  if (!roomId) return null

  const room = rooms.get(roomId)
  if (!room) return null

  const player = room.players.get(userId)
  if (!player) return null

  player.disconnected = true

  // If all disconnected, close room
  const allDisconnected = [...room.players.values()].every((p) => p.disconnected)
  if (allDisconnected) {
    closeRoom(roomId)
    return null
  }

  return { roomId, room }
}

export function reconnectPlayer(userId: string): { room: RoomState } | null {
  const roomId = userToRoomId.get(userId)
  if (!roomId) return null

  const room = rooms.get(roomId)
  if (!room) return null

  const player = room.players.get(userId)
  if (!player) return null

  player.disconnected = false
  room.lastActivityAt = Date.now()

  return { room }
}

export function getRoom(roomId: string): RoomState | null {
  return rooms.get(roomId) ?? null
}

export function getRoomByUser(userId: string): RoomState | null {
  const roomId = userToRoomId.get(userId)
  if (!roomId) return null
  return rooms.get(roomId) ?? null
}

export function closeRoom(roomId: string): void {
  const room = rooms.get(roomId)
  if (!room) return

  for (const userId of room.players.keys()) {
    userToRoomId.delete(userId)
  }
  codeToRoomId.delete(room.code)
  rooms.delete(roomId)
}

// Cleanup stale rooms
export function cleanupStaleRooms(): void {
  const now = Date.now()
  for (const [roomId, room] of rooms) {
    if (now - room.lastActivityAt > ROOM_TIMEOUT_MS) {
      closeRoom(roomId)
    }
  }
}
