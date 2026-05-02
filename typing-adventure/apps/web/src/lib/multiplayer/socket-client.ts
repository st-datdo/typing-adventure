import { io, type Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from './types'

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>

let socket: GameSocket | null = null

export function getSocket(userId: string, name: string, avatar: string): GameSocket {
  // Reuse existing socket instance (even if temporarily disconnected)
  if (socket) return socket

  const url = process.env.NEXT_PUBLIC_WS_URL ?? ''

  socket = io(url, {
    autoConnect: false,
    auth: { userId, name, avatar },
    reconnection: true,
    reconnectionAttempts: 3,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  })

  return socket
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function getCurrentSocket(): GameSocket | null {
  return socket
}
