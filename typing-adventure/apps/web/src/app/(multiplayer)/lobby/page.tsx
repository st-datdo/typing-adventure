'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMultiplayer } from '@/hooks/useMultiplayer'

type Tab = 'menu' | 'create' | 'join'

export default function LobbyPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { state, connect, createRoom, joinRoom, setReady, leaveRoom, userId } = useMultiplayer()
  const [tab, setTab] = useState<Tab>('menu')
  const [level, setLevel] = useState('easy')
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)

  // Connect socket on mount (no-op if already connected)
  useEffect(() => {
    if (session?.user) {
      connect()
    }
  }, [session, connect])

  // Navigate to race when countdown starts
  useEffect(() => {
    if (state.roomId && state.status === 'COUNTDOWN') {
      router.push(`/race/${state.roomId}`)
    }
  }, [state.status, state.roomId, router])

  const handleCreate = useCallback(() => {
    createRoom(level)
  }, [createRoom, level])

  const handleJoin = useCallback(() => {
    if (code.length >= 4) {
      joinRoom(code)
    }
  }, [joinRoom, code])

  const handleCopyCode = useCallback(() => {
    if (state.code) {
      navigator.clipboard.writeText(state.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [state.code])

  if (!session?.user) {
    return (
      <div className="mp-page">
        <div className="mp-center">
          <h1 className="mp-title">🏁 Multiplayer</h1>
          <p className="mp-subtitle">Đăng nhập để chơi đua gõ phím!</p>
          <Link href="/login" className="mp-btn mp-btn-primary">Đăng nhập</Link>
          <Link href="/" className="mp-btn mp-btn-back">← Quay lại</Link>
        </div>
      </div>
    )
  }

  // In a room — show waiting room
  if (state.roomId) {
    return (
      <div className="mp-page">
        <div className="mp-room">
          <h1 className="mp-title">🏁 Phòng Đua</h1>

          <div className="mp-room-code-wrap">
            <span className="mp-room-code-label">Mã phòng:</span>
            <span className="mp-room-code">{state.code}</span>
            <button className="mp-btn mp-btn-sm" onClick={handleCopyCode}>
              {copied ? '✅ Copied' : '📋 Copy'}
            </button>
          </div>

          <div className="mp-players">
            <h3 className="mp-section-title">
              Người chơi ({state.players.length}/4)
            </h3>
            {state.players.map((p) => (
              <div
                key={p.userId}
                className={`mp-player-card ${p.ready ? 'mp-player-ready' : ''} ${p.disconnected ? 'mp-player-dc' : ''}`}
              >
                <span className="mp-player-avatar">{p.avatar}</span>
                <span className="mp-player-name">
                  {p.name}
                  {p.userId === userId && ' (bạn)'}
                  {p.isHost && <span className="mp-host-badge">👑</span>}
                </span>
                <span className="mp-player-status">
                  {p.disconnected ? '⚠️ Mất kết nối' : p.ready ? '✅ Sẵn sàng' : '⏳ Chờ'}
                </span>
              </div>
            ))}
          </div>

          {state.players.length >= 2 && (
            <p className="mp-hint">
              Cần tất cả sẵn sàng để bắt đầu (ít nhất 2 người)
            </p>
          )}
          {state.players.length < 2 && (
            <p className="mp-hint">
              Chia sẻ mã phòng cho bạn bè để bắt đầu!
            </p>
          )}

          <div className="mp-actions">
            <button className="mp-btn mp-btn-primary mp-btn-lg" onClick={setReady}>
              ✋ Sẵn sàng!
            </button>
            <button className="mp-btn mp-btn-danger" onClick={leaveRoom}>
              🚪 Rời phòng
            </button>
          </div>

          {state.error && <p className="mp-error">{state.error}</p>}
        </div>
      </div>
    )
  }

  // Main menu
  return (
    <div className="mp-page">
      <div className="mp-center">
        <h1 className="mp-title">🏁 Multiplayer Race</h1>
        <p className="mp-subtitle">Đua gõ phím với bạn bè!</p>

        {!state.connected && (
          <p className="mp-hint">Đang kết nối...</p>
        )}

        {state.error && <p className="mp-error">{state.error}</p>}

        {tab === 'menu' && (
          <div className="mp-menu">
            <button
              className="mp-menu-btn"
              onClick={() => setTab('create')}
              disabled={!state.connected}
            >
              <span className="mp-menu-icon">🏠</span>
              <span className="mp-menu-label">Tạo phòng</span>
              <span className="mp-menu-desc">Tạo phòng và mời bạn bè</span>
            </button>
            <button
              className="mp-menu-btn"
              onClick={() => setTab('join')}
              disabled={!state.connected}
            >
              <span className="mp-menu-icon">🚪</span>
              <span className="mp-menu-label">Tham gia phòng</span>
              <span className="mp-menu-desc">Nhập mã phòng để vào</span>
            </button>
          </div>
        )}

        {tab === 'create' && (
          <div className="mp-form">
            <h3 className="mp-section-title">Chọn độ khó</h3>
            <div className="mp-level-pick">
              {(['easy', 'medium', 'hard'] as const).map((l) => (
                <button
                  key={l}
                  className={`mp-level-btn ${level === l ? 'active' : ''}`}
                  onClick={() => setLevel(l)}
                >
                  {l === 'easy' ? '🐣 Dễ' : l === 'medium' ? '🐥 Vừa' : '🦅 Khó'}
                </button>
              ))}
            </div>
            <button className="mp-btn mp-btn-primary mp-btn-lg" onClick={handleCreate}>
              🏠 Tạo phòng
            </button>
            <button className="mp-btn mp-btn-back" onClick={() => setTab('menu')}>
              ← Quay lại
            </button>
          </div>
        )}

        {tab === 'join' && (
          <div className="mp-form">
            <h3 className="mp-section-title">Nhập mã phòng</h3>
            <input
              className="mp-code-input"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="VD: ABC123"
              maxLength={6}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
            <button
              className="mp-btn mp-btn-primary mp-btn-lg"
              onClick={handleJoin}
              disabled={code.length < 4}
            >
              🚪 Tham gia
            </button>
            <button className="mp-btn mp-btn-back" onClick={() => setTab('menu')}>
              ← Quay lại
            </button>
          </div>
        )}

        <Link href="/" className="mp-btn mp-btn-back" style={{ marginTop: 24 }}>
          ← Quay lại game
        </Link>
      </div>
    </div>
  )
}
