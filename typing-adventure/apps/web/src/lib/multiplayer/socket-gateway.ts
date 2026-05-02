import type { Server, Socket } from 'socket.io'
import type { ClientToServerEvents, ServerToClientEvents, RaceResultData } from './types'
import { playerToDTO } from './types'
import * as RaceRoom from './race-room'
import * as AntiCheat from './anti-cheat'
import { pickWords } from '@typing-adventure/game-engine'
import type { Level } from '@typing-adventure/game-engine'

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>

// Map socketId → userId for disconnect handling
const socketToUser = new Map<string, string>()
const userToSocket = new Map<string, string>()

// Reconnect timers — if user doesn't reconnect in 15s, leave room
const disconnectTimers = new Map<string, ReturnType<typeof setTimeout>>()

export function setupSocketGateway(io: Server<ClientToServerEvents, ServerToClientEvents>): void {
  // Cleanup stale rooms every 60s
  setInterval(() => RaceRoom.cleanupStaleRooms(), 60_000)

  io.on('connection', (socket: TypedSocket) => {
    const userId = (socket.handshake.auth as { userId?: string }).userId
    const userName = (socket.handshake.auth as { name?: string }).name ?? 'Player'
    const userAvatar = (socket.handshake.auth as { avatar?: string }).avatar ?? '🧒'

    if (!userId) {
      socket.emit('error', { code: 'AUTH_REQUIRED', message: 'userId required' })
      socket.disconnect()
      return
    }

    // Check for reconnect
    const existingSocketId = userToSocket.get(userId)
    if (existingSocketId) {
      // Kick old socket
      const oldSocket = io.sockets.sockets.get(existingSocketId)
      if (oldSocket) oldSocket.disconnect()
    }

    socketToUser.set(socket.id, userId)
    userToSocket.set(userId, socket.id)

    // Cancel any disconnect timer
    const timer = disconnectTimers.get(userId)
    if (timer) {
      clearTimeout(timer)
      disconnectTimers.delete(userId)
    }

    // Try to reconnect to existing room
    const reconnected = RaceRoom.reconnectPlayer(userId)
    if (reconnected) {
      const { room } = reconnected
      socket.join(room.roomId)
      io.to(room.roomId).emit('player_reconnected', { userId })
      socket.emit('room_joined', {
        roomId: room.roomId,
        code: room.code,
        text: room.text,
        level: room.level,
        status: room.status,
        players: [...room.players.values()].map((p) => playerToDTO(p, room.hostUserId)),
      })
    }

    // ── create_room ──
    socket.on('create_room', ({ level }) => {
      const validLevels = ['easy', 'medium', 'hard']
      if (!validLevels.includes(level)) {
        socket.emit('error', { code: 'INVALID_LEVEL', message: 'Invalid level' })
        return
      }

      const text = pickWords(level as Level, 15)
      const room = RaceRoom.createRoom(userId, userName, userAvatar, level, text)

      socket.join(room.roomId)
      AntiCheat.initPlayerCheck(userId)

      socket.emit('room_created', {
        roomId: room.roomId,
        code: room.code,
        text: room.text,
        players: [...room.players.values()].map((p) => playerToDTO(p, room.hostUserId)),
      })
    })

    // ── join_room ──
    socket.on('join_room', ({ code }) => {
      const { room, error } = RaceRoom.joinRoom(code, userId, userName, userAvatar)

      if (!room) {
        socket.emit('error', { code: 'JOIN_FAILED', message: error ?? 'Failed to join' })
        return
      }

      socket.join(room.roomId)
      AntiCheat.initPlayerCheck(userId)

      // Notify others
      const player = room.players.get(userId)
      if (player) {
        socket.to(room.roomId).emit('player_joined', playerToDTO(player, room.hostUserId))
      }

      // Send full state to joiner
      socket.emit('room_joined', {
        roomId: room.roomId,
        code: room.code,
        text: room.text,
        level: room.level,
        status: room.status,
        players: [...room.players.values()].map((p) => playerToDTO(p, room.hostUserId)),
      })
    })

    // ── player_ready ──
    socket.on('player_ready', ({ roomId }) => {
      const result = RaceRoom.setPlayerReady(roomId, userId)
      if (!result) return

      io.to(roomId).emit('ready_status', { readyPlayers: result.readyPlayers })

      if (result.allReady) {
        RaceRoom.startCountdown(roomId)
        // Countdown: 3, 2, 1
        let count = 3
        const interval = setInterval(() => {
          io.to(roomId).emit('countdown', { seconds: count })
          count--
          if (count < 0) {
            clearInterval(interval)
            const room = RaceRoom.startRace(roomId)
            if (room) {
              io.to(roomId).emit('race_start', {
                text: room.text,
                startTime: room.startedAt ?? Date.now(),
              })
            }
          }
        }, 1000)
      }
    })

    // ── progress ──
    socket.on('progress', ({ roomId, currentIndex, wpm, accuracy }) => {
      const room = RaceRoom.getRoom(roomId)
      if (!room) return

      // Anti-cheat validation
      const cheatResult = AntiCheat.validateProgress(userId, currentIndex, wpm, room.text.length)
      if (!cheatResult.valid) {
        if (cheatResult.shouldKick) {
          socket.emit('error', { code: 'CHEAT_DETECTED', message: 'Suspicious activity detected' })
          handleLeave(socket, io, userId, roomId)
          return
        }
        // Don't broadcast flagged progress
        return
      }

      const player = RaceRoom.updateProgress(roomId, userId, currentIndex, wpm, accuracy)
      if (player) {
        io.to(roomId).emit('progress_update', {
          userId,
          currentIndex: player.currentIndex,
          wpm: player.wpm,
          accuracy: player.accuracy,
        })
      }
    })

    // ── finish ──
    socket.on('finish', ({ roomId, wpm, accuracy, timeSeconds }) => {
      const result = RaceRoom.playerFinish(roomId, userId, wpm, accuracy, timeSeconds)
      if (!result) return

      io.to(roomId).emit('player_finished', {
        userId,
        wpm: result.player.wpm,
        accuracy: result.player.accuracy,
        rank: result.player.rank ?? 1,
        finishTime: result.player.finishTime ?? timeSeconds,
      })

      if (result.allFinished) {
        finishRace(io, roomId)
      } else {
        // Start timeout for remaining players
        setTimeout(() => {
          const room = RaceRoom.getRoom(roomId)
          if (room && room.status === 'RACING') {
            finishRace(io, roomId)
          }
        }, 60_000)
      }
    })

    // ── leave_room ──
    socket.on('leave_room', ({ roomId }) => {
      handleLeave(socket, io, userId, roomId)
    })

    // ── disconnect ──
    socket.on('disconnect', () => {
      socketToUser.delete(socket.id)

      // Don't immediately leave — give 15s to reconnect
      const info = RaceRoom.markDisconnected(userId)
      if (info) {
        io.to(info.roomId).emit('player_disconnected', { userId })

        const timer = setTimeout(() => {
          disconnectTimers.delete(userId)
          handleLeave(socket, io, userId, info.roomId)
        }, 15_000)
        disconnectTimers.set(userId, timer)
      } else {
        userToSocket.delete(userId)
      }
    })
  })
}

function handleLeave(
  socket: TypedSocket,
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  userId: string,
  roomId: string,
): void {
  const result = RaceRoom.leaveRoom(userId)
  AntiCheat.removePlayerCheck(userId)
  socket.leave(roomId)

  if (result && !result.isEmpty) {
    io.to(roomId).emit('player_left', { userId })
    if (result.newHostId) {
      io.to(roomId).emit('host_changed', { userId: result.newHostId })
    }

    // Check if race should end
    const room = RaceRoom.getRoom(roomId)
    if (room && room.status === 'RACING') {
      const activePlayers = [...room.players.values()].filter((p) => !p.disconnected)
      if (activePlayers.length === 0 || activePlayers.every((p) => p.finished)) {
        finishRace(io, roomId)
      }
    }
  }
}

function finishRace(io: Server<ClientToServerEvents, ServerToClientEvents>, roomId: string): void {
  const results = RaceRoom.endRace(roomId)
  if (results) {
    io.to(roomId).emit('race_end', { results })
  }

  // Save to database asynchronously
  saveRaceToDb(roomId, results).catch(() => {
    // Silently fail — race is already complete
  })

  // Close room after 30s
  setTimeout(() => {
    RaceRoom.closeRoom(roomId)
  }, 30_000)
}

async function saveRaceToDb(roomId: string, results: RaceResultData[] | null): Promise<void> {
  if (!results || results.length === 0) return

  try {
    // Dynamic import to avoid bundling prisma in client
    const { prisma } = await import('@typing-adventure/db')
    const room = RaceRoom.getRoom(roomId)

    // Update RaceRoom record
    const dbRoom = await prisma.raceRoom.findUnique({ where: { code: room?.code ?? '' } })

    let raceRoomId: string
    if (dbRoom) {
      await prisma.raceRoom.update({
        where: { id: dbRoom.id },
        data: { status: 'FINISHED', endedAt: new Date() },
      })
      raceRoomId = dbRoom.id
    } else {
      const created = await prisma.raceRoom.create({
        data: {
          code: room?.code ?? roomId.slice(0, 6),
          text: room?.text ?? '',
          level: room?.level ?? 'easy',
          status: 'FINISHED',
          startedAt: room?.startedAt ? new Date(room.startedAt) : null,
          endedAt: new Date(),
        },
      })
      raceRoomId = created.id
    }

    // Save results
    for (const r of results) {
      await prisma.raceResult.upsert({
        where: { roomId_userId: { roomId: raceRoomId, userId: r.userId } },
        update: {
          wpm: r.wpm,
          accuracy: r.accuracy,
          position: r.position,
          finishTime: r.finishTime,
        },
        create: {
          roomId: raceRoomId,
          userId: r.userId,
          wpm: r.wpm,
          accuracy: r.accuracy,
          position: r.position,
          finishTime: r.finishTime,
        },
      })
    }
  } catch {
    // DB save is best-effort
  }
}
