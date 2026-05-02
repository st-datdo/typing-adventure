'use client'

import type { RoomPlayerDTO } from '@/lib/multiplayer/types'

interface PlayerListProps {
  players: RoomPlayerDTO[]
  currentUserId?: string
}

export function PlayerList({ players, currentUserId }: PlayerListProps) {
  return (
    <div className="mp-player-list">
      {players.map((p) => (
        <div
          key={p.userId}
          className={`mp-player-card ${p.finished ? 'mp-player-finished' : ''} ${p.disconnected ? 'mp-player-dc' : ''}`}
        >
          <span className="mp-player-avatar">{p.avatar}</span>
          <span className="mp-player-name">
            {p.name}
            {p.userId === currentUserId && ' (bạn)'}
            {p.isHost && <span className="mp-host-badge">👑</span>}
          </span>
          <span className="mp-player-wpm">{p.wpm} WPM</span>
          <span className="mp-player-status">
            {p.disconnected
              ? '⚠️'
              : p.finished
              ? '🏁'
              : p.ready
              ? '✅'
              : '⏳'}
          </span>
        </div>
      ))}
    </div>
  )
}
