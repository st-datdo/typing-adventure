'use client'

import { createContext, useContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { getSocket, disconnectSocket, type GameSocket } from '@/lib/multiplayer/socket-client'
import type { RoomStatus, RoomPlayerDTO, RaceResultData } from '@/lib/multiplayer/types'

export interface MultiplayerState {
  connected: boolean
  roomId: string | null
  code: string | null
  text: string
  level: string
  status: RoomStatus
  players: RoomPlayerDTO[]
  countdownSeconds: number | null
  raceStartTime: number | null
  results: RaceResultData[] | null
  error: string | null
}

const INITIAL_STATE: MultiplayerState = {
  connected: false,
  roomId: null,
  code: null,
  text: '',
  level: 'easy',
  status: 'WAITING',
  players: [],
  countdownSeconds: null,
  raceStartTime: null,
  results: null,
  error: null,
}

interface MultiplayerContextValue {
  state: MultiplayerState
  userId: string | undefined
  connect: () => void
  createRoom: (level: string) => void
  joinRoom: (code: string) => void
  setReady: () => void
  sendProgress: (currentIndex: number, wpm: number, accuracy: number) => void
  sendFinish: (wpm: number, accuracy: number, timeSeconds: number) => void
  leaveRoom: () => void
  reset: () => void
}

const MultiplayerContext = createContext<MultiplayerContextValue | null>(null)

export function useMultiplayerContext(): MultiplayerContextValue {
  const ctx = useContext(MultiplayerContext)
  if (!ctx) {
    throw new Error('useMultiplayerContext must be used within <MultiplayerProvider>')
  }
  return ctx
}

export function MultiplayerProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const [state, setState] = useState<MultiplayerState>(INITIAL_STATE)
  const socketRef = useRef<GameSocket | null>(null)
  const listenersAttached = useRef(false)

  const userId = session?.user?.id
  const userName = session?.user?.name ?? 'Player'
  const userAvatar = session?.user?.image ?? '🧒'

  const connect = useCallback(() => {
    if (!userId) return
    if (socketRef.current?.connected) return

    const socket = getSocket(userId, userName, userAvatar)
    socketRef.current = socket

    if (!listenersAttached.current) {
      listenersAttached.current = true

      socket.on('connect', () => {
        setState((s) => ({ ...s, connected: true, error: null }))
      })

      socket.on('disconnect', () => {
        setState((s) => ({ ...s, connected: false }))
      })

      socket.on('room_created', ({ roomId, code, text, players }) => {
        setState((s) => ({
          ...s,
          roomId,
          code,
          text,
          players,
          status: 'WAITING',
          results: null,
          error: null,
        }))
      })

      socket.on('room_joined', ({ roomId, code, text, level, status, players }) => {
        setState((s) => ({
          ...s,
          roomId,
          code,
          text,
          level,
          status,
          players,
          results: null,
          error: null,
        }))
      })

      socket.on('player_joined', (player) => {
        setState((s) => ({
          ...s,
          players: [...s.players.filter((p) => p.userId !== player.userId), player],
        }))
      })

      socket.on('player_left', ({ userId: leftId }) => {
        setState((s) => {
          // During a race, keep the player in the list but mark as disconnected
          // so the UI can still show them. Only remove during WAITING.
          if (s.status === 'RACING' || s.status === 'COUNTDOWN') {
            return {
              ...s,
              players: s.players.map((p) =>
                p.userId === leftId ? { ...p, disconnected: true, finished: true } : p,
              ),
            }
          }
          return {
            ...s,
            players: s.players.filter((p) => p.userId !== leftId),
          }
        })
      })

      socket.on('ready_status', ({ readyPlayers }) => {
        setState((s) => ({
          ...s,
          players: s.players.map((p) => ({
            ...p,
            ready: readyPlayers.includes(p.userId),
          })),
        }))
      })

      socket.on('countdown', ({ seconds }) => {
        setState((s) => ({ ...s, status: 'COUNTDOWN', countdownSeconds: seconds }))
      })

      socket.on('race_start', ({ text, startTime }) => {
        setState((s) => ({
          ...s,
          status: 'RACING',
          text,
          raceStartTime: startTime,
          countdownSeconds: null,
        }))
      })

      socket.on('progress_update', ({ userId: uid, currentIndex, wpm, accuracy }) => {
        setState((s) => ({
          ...s,
          players: s.players.map((p) =>
            p.userId === uid ? { ...p, currentIndex, wpm, accuracy } : p,
          ),
        }))
      })

      socket.on('player_finished', ({ userId: uid, wpm, accuracy, rank, finishTime }) => {
        setState((s) => ({
          ...s,
          players: s.players.map((p) =>
            p.userId === uid ? { ...p, wpm, accuracy, finished: true } : p,
          ),
        }))
      })

      socket.on('race_end', ({ results }) => {
        setState((s) => ({ ...s, status: 'FINISHED', results }))
      })

      socket.on('player_disconnected', ({ userId: uid }) => {
        setState((s) => ({
          ...s,
          players: s.players.map((p) =>
            p.userId === uid ? { ...p, disconnected: true } : p,
          ),
        }))
      })

      socket.on('player_reconnected', ({ userId: uid }) => {
        setState((s) => ({
          ...s,
          players: s.players.map((p) =>
            p.userId === uid ? { ...p, disconnected: false } : p,
          ),
        }))
      })

      socket.on('host_changed', ({ userId: newHostId }) => {
        setState((s) => ({
          ...s,
          players: s.players.map((p) => ({
            ...p,
            isHost: p.userId === newHostId,
          })),
        }))
      })

      socket.on('error', ({ code, message }) => {
        setState((s) => ({ ...s, error: message }))
      })
    }

    socket.connect()
  }, [userId, userName, userAvatar])

  // Disconnect only when the entire multiplayer layout unmounts
  // (i.e., user navigates away from /lobby and /race entirely)
  useEffect(() => {
    return () => {
      disconnectSocket()
      listenersAttached.current = false
    }
  }, [])

  const createRoom = useCallback((level: string) => {
    socketRef.current?.emit('create_room', { level })
  }, [])

  const joinRoom = useCallback((code: string) => {
    socketRef.current?.emit('join_room', { code: code.toUpperCase() })
  }, [])

  const setReady = useCallback(() => {
    if (state.roomId) {
      socketRef.current?.emit('player_ready', { roomId: state.roomId })
    }
  }, [state.roomId])

  const sendProgress = useCallback((currentIndex: number, wpm: number, accuracy: number) => {
    if (state.roomId) {
      socketRef.current?.emit('progress', {
        roomId: state.roomId,
        currentIndex,
        wpm,
        accuracy,
      })
    }
  }, [state.roomId])

  const sendFinish = useCallback((wpm: number, accuracy: number, timeSeconds: number) => {
    if (state.roomId) {
      socketRef.current?.emit('finish', {
        roomId: state.roomId,
        wpm,
        accuracy,
        timeSeconds,
      })
    }
  }, [state.roomId])

  const leaveRoom = useCallback(() => {
    if (state.roomId) {
      socketRef.current?.emit('leave_room', { roomId: state.roomId })
    }
    setState(INITIAL_STATE)
  }, [state.roomId])

  const reset = useCallback(() => {
    setState((s) => ({ ...INITIAL_STATE, connected: s.connected }))
  }, [])

  return (
    <MultiplayerContext.Provider
      value={{
        state,
        userId,
        connect,
        createRoom,
        joinRoom,
        setReady,
        sendProgress,
        sendFinish,
        leaveRoom,
        reset,
      }}
    >
      {children}
    </MultiplayerContext.Provider>
  )
}
