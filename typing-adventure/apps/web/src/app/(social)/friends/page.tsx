'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  getFriends,
  getFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  removeFriend,
} from '@/lib/api/friends'
import type { Friend, FriendRequest } from '@/lib/api/friends'
import { useSettingsStore } from '@/stores/settings-store'
import { t, tReplace } from '@typing-adventure/i18n'

type Tab = 'friends' | 'requests' | 'search'

export default function FriendsPage() {
  const lang = useSettingsStore(s => s.lang)
  const [tab, setTab] = useState<Tab>('friends')
  const [friends, setFriends] = useState<Friend[]>([])
  const [requests, setRequests] = useState<{
    received: FriendRequest[]
    sent: FriendRequest[]
  }>({ received: [], sent: [] })
  const [loading, setLoading] = useState(true)
  const [searchEmail, setSearchEmail] = useState('')
  const [searchStatus, setSearchStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [searchError, setSearchError] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [friendsRes, reqRes] = await Promise.all([
        getFriends(),
        getFriendRequests(),
      ])
      if (friendsRes.success && friendsRes.data) {
        setFriends(friendsRes.data)
      }
      if (reqRes.success && reqRes.data) {
        setRequests(reqRes.data)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleAccept(friendshipId: string) {
    const res = await acceptFriendRequest(friendshipId)
    if (res.success) {
      loadData()
    }
  }

  async function handleReject(friendshipId: string) {
    const res = await removeFriend(friendshipId)
    if (res.success) {
      loadData()
    }
  }

  async function handleRemoveFriend(friendshipId: string) {
    if (!confirm(t(lang, 'friendsRemoveConfirm'))) return
    const res = await removeFriend(friendshipId)
    if (res.success) {
      loadData()
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!searchEmail.trim()) return
    setSearchStatus('sending')
    setSearchError('')
    const res = await sendFriendRequest({ email: searchEmail.trim() })
    if (res.success) {
      setSearchStatus('sent')
      setSearchEmail('')
      loadData()
    } else {
      setSearchStatus('error')
      setSearchError(res.error ?? 'Error')
    }
  }

  function formatLastActive(dateStr: string | null): string {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffDays === 0) return lang === 'vi' ? 'Hôm nay' : 'Today'
    if (diffDays === 1) return lang === 'vi' ? 'Hôm qua' : 'Yesterday'
    if (diffDays < 7) return lang === 'vi' ? `${diffDays} ngày trước` : `${diffDays}d ago`
    return d.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { month: 'short', day: 'numeric' })
  }

  const pendingCount = requests.received.length

  return (
    <div className="social-page">
      <Link href="/" className="social-back">
        {t(lang, 'backHome')}
      </Link>

      <div className="social-header">
        <h1 className="social-title">{t(lang, 'friendsTitle')}</h1>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        <button
          className={`tab-btn ${tab === 'friends' ? 'tab-btn--active' : ''}`}
          onClick={() => setTab('friends')}
        >
          {tReplace(lang, 'friendsTabList', friends.length)}
        </button>
        <button
          className={`tab-btn ${tab === 'requests' ? 'tab-btn--active' : ''}`}
          onClick={() => setTab('requests')}
        >
          {t(lang, 'friendsTabRequests')} {pendingCount > 0 && `(${pendingCount})`}
        </button>
        <button
          className={`tab-btn ${tab === 'search' ? 'tab-btn--active' : ''}`}
          onClick={() => setTab('search')}
        >
          {t(lang, 'friendsTabSearch')}
        </button>
      </div>

      {loading ? (
        <div className="social-empty">
          <div className="social-empty-icon">⏳</div>
          <div className="social-empty-text">{t(lang, 'lbLoading')}</div>
        </div>
      ) : (
        <>
          {/* Friends list */}
          {tab === 'friends' && (
            friends.length === 0 ? (
              <div className="social-empty">
                <div className="social-empty-icon">👋</div>
                <div className="social-empty-text">
                  {t(lang, 'friendsEmpty')}
                </div>
              </div>
            ) : (
              <div className="friend-list">
                {friends.map(f => (
                  <div key={f.friendshipId} className="friend-item">
                    <span className="friend-avatar">{f.avatar}</span>
                    <div className="friend-info">
                      <div className="friend-name">{f.name ?? t(lang, 'profilePlayer')}</div>
                      <div className="friend-meta">
                        {tReplace(lang, 'friendsBestWpm', f.bestWpm)} · {tReplace(lang, 'friendsGames', f.totalGames)}
                        {f.lastPlayDate && (
                          <> · {tReplace(lang, 'friendsLastActive', formatLastActive(f.lastPlayDate))}</>
                        )}
                      </div>
                    </div>
                    <div className="friend-actions">
                      <Link
                        href={`/profile/${f.id}`}
                        className="friend-btn friend-btn--view"
                      >
                        {t(lang, 'friendsView')}
                      </Link>
                      <button
                        className="friend-btn friend-btn--reject"
                        onClick={() => handleRemoveFriend(f.friendshipId)}
                      >
                        {t(lang, 'friendsRemove')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Requests */}
          {tab === 'requests' && (
            <>
              {requests.received.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-dim)', marginBottom: 10 }}>
                    {tReplace(lang, 'friendsReceived', requests.received.length)}
                  </h3>
                  <div className="friend-list">
                    {requests.received.map(r => (
                      <div key={r.friendshipId} className="friend-item">
                        <span className="friend-avatar">{r.user.avatar}</span>
                        <div className="friend-info">
                          <div className="friend-name">{r.user.name ?? r.user.email}</div>
                          <div className="friend-meta">{r.user.email}</div>
                        </div>
                        <div className="friend-actions">
                          <button
                            className="friend-btn friend-btn--accept"
                            onClick={() => handleAccept(r.friendshipId)}
                          >
                            {t(lang, 'friendsAccept')}
                          </button>
                          <button
                            className="friend-btn friend-btn--reject"
                            onClick={() => handleReject(r.friendshipId)}
                          >
                            {t(lang, 'friendsReject')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {requests.sent.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-dim)', marginBottom: 10 }}>
                    {tReplace(lang, 'friendsSent', requests.sent.length)}
                  </h3>
                  <div className="friend-list">
                    {requests.sent.map(r => (
                      <div key={r.friendshipId} className="friend-item">
                        <span className="friend-avatar">{r.user.avatar}</span>
                        <div className="friend-info">
                          <div className="friend-name">{r.user.name ?? r.user.email}</div>
                          <div className="friend-meta">{t(lang, 'friendsWaiting')}</div>
                        </div>
                        <div className="friend-actions">
                          <button
                            className="friend-btn friend-btn--reject"
                            onClick={() => handleReject(r.friendshipId)}
                          >
                            {t(lang, 'friendsCancel')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {requests.received.length === 0 && requests.sent.length === 0 && (
                <div className="social-empty">
                  <div className="social-empty-icon">📬</div>
                  <div className="social-empty-text">{t(lang, 'friendsNoRequests')}</div>
                </div>
              )}
            </>
          )}

          {/* Search */}
          {tab === 'search' && (
            <div>
              <form onSubmit={handleSearch}>
                <input
                  className="search-input"
                  type="email"
                  placeholder={t(lang, 'friendsSearchPlaceholder')}
                  value={searchEmail}
                  onChange={e => {
                    setSearchEmail(e.target.value)
                    setSearchStatus('idle')
                  }}
                />
                <button
                  className="btn"
                  type="submit"
                  disabled={searchStatus === 'sending' || !searchEmail.trim()}
                  style={{ width: '100%' }}
                >
                  {searchStatus === 'sending'
                    ? t(lang, 'friendsSearchSending')
                    : t(lang, 'friendsSearchBtn')}
                </button>
              </form>

              {searchStatus === 'sent' && (
                <div style={{
                  marginTop: 12,
                  padding: '10px 14px',
                  background: 'rgba(0, 230, 118, 0.1)',
                  border: '1px solid rgba(0, 230, 118, 0.2)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-correct)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}>
                  {t(lang, 'friendsSearchSent')}
                </div>
              )}

              {searchStatus === 'error' && (
                <div style={{
                  marginTop: 12,
                  padding: '10px 14px',
                  background: 'rgba(255, 82, 82, 0.1)',
                  border: '1px solid rgba(255, 82, 82, 0.2)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-wrong)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}>
                  {searchError}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
