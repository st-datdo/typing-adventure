'use client'

import type { RoomPlayerDTO } from '@/lib/multiplayer/types'

interface RaceTrackProps {
  players: RoomPlayerDTO[]
  textLength: number
  currentUserId?: string
}

export function RaceTrack({ players, textLength, currentUserId }: RaceTrackProps) {
  return (
    <div className="mp-race-track">
      {players.map((p) => {
        const progress = textLength > 0 ? (p.currentIndex / textLength) * 100 : 0
        const isMe = p.userId === currentUserId

        return (
          <div
            key={p.userId}
            className={`mp-track-lane ${isMe ? 'mp-track-mine' : ''} ${p.finished ? 'mp-track-finished' : ''}`}
          >
            <div className="mp-track-info">
              <span className="mp-track-avatar">{p.avatar}</span>
              <span className="mp-track-name">
                {p.name}
                {p.isHost && <span className="mp-host-badge">👑</span>}
              </span>
              <span className="mp-track-wpm">{p.wpm} WPM</span>
            </div>
            <div className="mp-track-bar">
              <div
                className="mp-track-progress"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
              <div
                className="mp-track-runner"
                style={{ left: `${Math.min(progress, 100)}%` }}
              >
                {p.finished ? '🏁' : p.avatar}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
