'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMultiplayer } from '@/hooks/useMultiplayer'
import { TopBar } from '@/components/ui/TopBar'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

type Tab = 'menu' | 'create' | 'join'

const LEVELS = [
  { id: 'easy', emoji: '🐣', label: 'Dễ' },
  { id: 'medium', emoji: '🐥', label: 'Vừa' },
  { id: 'hard', emoji: '🦅', label: 'Khó' },
] as const

export default function LobbyPage() {
  const { data: session, status } = useSession()
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

  if (status === 'loading') {
    return <LoadingScreen icon="🏁" />
  }

  if (!session?.user) {
    return (
      <div className="ui-page ui-page--narrow">
        <TopBar back={{ href: '/', label: 'Quay lại' }} title="🏁 Multiplayer" />
        <div className="ui-card mp-center">
          <span className="mp-hero-emoji" aria-hidden>🏎️</span>
          <p className="ui-subtitle">Đăng nhập để chơi đua gõ phím!</p>
          <Link href="/login" className="ui-btn ui-btn--go ui-btn--lg ui-btn--block">Đăng nhập</Link>
        </div>
      </div>
    )
  }

  // In a room — show waiting room
  if (state.roomId) {
    return (
      <div className="ui-page ui-page--narrow">
        <TopBar back={{ onClick: leaveRoom, label: 'Rời phòng' }} title="🏁 Phòng Đua" />

        <div className="mp-room-code-wrap">
          <span className="mp-room-code-label">Mã phòng:</span>
          <span className="mp-room-code">{state.code}</span>
          <button className="ui-btn ui-btn--sm" onClick={handleCopyCode}>
            {copied ? '✅ Copied' : '📋 Copy'}
          </button>
        </div>

        <section className="ui-card">
          <h2 className="ui-section-title">
            Người chơi ({state.players.length}/4)
          </h2>
          <div className="mp-player-list">
            {state.players.map((p) => (
              <div
                key={p.userId}
                className={`mp-player-card ${p.ready ? 'mp-player-ready' : ''} ${p.disconnected ? 'mp-player-dc' : ''} ${p.userId === userId ? 'mp-player-me' : ''}`}
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
        </section>

        <p className="mp-hint">
          {state.players.length >= 2
            ? 'Cần tất cả sẵn sàng để bắt đầu (ít nhất 2 người)'
            : 'Chia sẻ mã phòng cho bạn bè để bắt đầu!'}
        </p>

        <div className="mp-actions">
          <button className="ui-btn ui-btn--go ui-btn--lg" onClick={setReady}>
            ✋ Sẵn sàng!
          </button>
          <button className="ui-btn ui-btn--danger" onClick={leaveRoom}>
            🚪 Rời phòng
          </button>
        </div>

        {state.error && <p className="mp-error" role="alert">{state.error}</p>}
      </div>
    )
  }

  // Main menu
  return (
    <div className="ui-page ui-page--narrow mp-lobby">
      <TopBar
        back={tab === 'menu' ? { href: '/', label: 'Quay lại game' } : { onClick: () => setTab('menu'), label: 'Quay lại' }}
        title="🏁 Multiplayer Race"
        subtitle="Đua gõ phím với bạn bè!"
      />

      {!state.connected && (
        <p className="mp-status" role="status">
          <span className="mp-status-dot" aria-hidden />
          Đang kết nối...
        </p>
      )}

      {state.error && <p className="mp-error" role="alert">{state.error}</p>}

      {tab === 'menu' && (
        <div className="mp-menu">
          <button
            className="mp-menu-btn mp-menu-btn--create"
            onClick={() => setTab('create')}
            disabled={!state.connected}
          >
            <span className="mp-menu-icon">🏠</span>
            <span className="mp-menu-label">Tạo phòng</span>
            <span className="mp-menu-desc">Tạo phòng và mời bạn bè</span>
          </button>
          <button
            className="mp-menu-btn mp-menu-btn--join"
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
        <section className="ui-card mp-form">
          <h2 className="ui-section-title">Chọn độ khó</h2>
          <div className="mp-level-pick" role="radiogroup">
            {LEVELS.map((l) => (
              <button
                key={l.id}
                role="radio"
                aria-checked={level === l.id}
                className={`mp-level-btn ${level === l.id ? 'mp-level-btn--active' : ''}`}
                onClick={() => setLevel(l.id)}
              >
                <span className="mp-level-emoji" aria-hidden>{l.emoji}</span>
                {l.label}
              </button>
            ))}
          </div>
          <button className="ui-btn ui-btn--go ui-btn--lg ui-btn--block" onClick={handleCreate}>
            🏠 Tạo phòng
          </button>
        </section>
      )}

      {tab === 'join' && (
        <section className="ui-card mp-form">
          <h2 className="ui-section-title">Nhập mã phòng</h2>
          <input
            className="ui-input mp-code-input"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="VD: ABC123"
            maxLength={6}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          />
          <button
            className="ui-btn ui-btn--go ui-btn--lg ui-btn--block"
            onClick={handleJoin}
            disabled={code.length < 4}
          >
            🚪 Tham gia
          </button>
        </section>
      )}
    </div>
  )
}
