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
        const progress = Math.min(textLength > 0 ? (p.currentIndex / textLength) * 100 : 0, 100)
        const isMe = p.userId === currentUserId

        return (
          <div
            key={p.userId}
            className={`mp-track-lane ${isMe ? 'mp-track-mine' : ''} ${p.finished ? 'mp-track-finished' : ''} ${p.disconnected ? 'mp-track-dc' : ''}`}
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
              <div className="mp-track-road">
                <div
                  className="mp-track-progress"
                  style={{ width: `${progress}%` }}
                />
                <div
                  className="mp-track-runner"
                  style={{ left: `${progress}%` }}
                >
                  {p.avatar}
                </div>
              </div>
              <span className="mp-track-flag" aria-hidden>🏁</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
