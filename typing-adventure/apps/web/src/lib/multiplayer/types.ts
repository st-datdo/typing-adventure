export type RoomStatus = 'WAITING' | 'COUNTDOWN' | 'RACING' | 'FINISHED'

export interface RoomPlayer {
  userId: string
  name: string
  avatar: string
  ready: boolean
  currentIndex: number
  wpm: number
  accuracy: number
  finished: boolean
  finishTime: number | null
  rank: number | null
  disconnected: boolean
}

export interface RoomState {
  roomId: string
  code: string
  hostUserId: string
  level: string
  text: string
  status: RoomStatus
  maxPlayers: number
  players: Map<string, RoomPlayer>
  createdAt: number
  startedAt: number | null
  lastActivityAt: number
}

export interface RaceResultData {
  userId: string
  wpm: number
  accuracy: number
  position: number
  finishTime: number | null
}

// Client → Server events
export interface ClientToServerEvents {
  create_room: (data: { level: string }) => void
  join_room: (data: { code: string }) => void
  player_ready: (data: { roomId: string }) => void
  progress: (data: { roomId: string; currentIndex: number; wpm: number; accuracy: number }) => void
  finish: (data: { roomId: string; wpm: number; accuracy: number; timeSeconds: number }) => void
  leave_room: (data: { roomId: string }) => void
}

// Server → Client events
export interface ServerToClientEvents {
  room_created: (data: { roomId: string; code: string; text: string; players: RoomPlayerDTO[] }) => void
  room_joined: (data: { roomId: string; code: string; text: string; level: string; status: RoomStatus; players: RoomPlayerDTO[] }) => void
  player_joined: (data: RoomPlayerDTO) => void
  player_left: (data: { userId: string }) => void
  ready_status: (data: { readyPlayers: string[] }) => void
  countdown: (data: { seconds: number }) => void
  race_start: (data: { text: string; startTime: number }) => void
  progress_update: (data: { userId: string; currentIndex: number; wpm: number; accuracy: number }) => void
  player_finished: (data: { userId: string; wpm: number; accuracy: number; rank: number; finishTime: number }) => void
  race_end: (data: { results: RaceResultData[] }) => void
  error: (data: { code: string; message: string }) => void
  host_changed: (data: { userId: string }) => void
  player_disconnected: (data: { userId: string }) => void
  player_reconnected: (data: { userId: string }) => void
}

export interface RoomPlayerDTO {
  userId: string
  name: string
  avatar: string
  ready: boolean
  currentIndex: number
  wpm: number
  accuracy: number
  finished: boolean
  disconnected: boolean
  isHost: boolean
}

export function playerToDTO(p: RoomPlayer, hostUserId?: string): RoomPlayerDTO {
  return {
    userId: p.userId,
    name: p.name,
    avatar: p.avatar,
    ready: p.ready,
    currentIndex: p.currentIndex,
    wpm: p.wpm,
    accuracy: p.accuracy,
    finished: p.finished,
    disconnected: p.disconnected,
    isHost: p.userId === hostUserId,
  }
}
