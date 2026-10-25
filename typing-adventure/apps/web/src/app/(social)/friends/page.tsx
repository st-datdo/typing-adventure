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
import { TopBar } from '@/components/ui/TopBar'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

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
    <div className="ui-page social-page">
      <TopBar back={{ href: '/', label: t(lang, 'backHome').replace('← ', '') }} title={t(lang, 'friendsTitle')} />

      <div className="ui-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'friends'}
          className={`ui-tab ${tab === 'friends' ? 'ui-tab--active' : ''}`}
          onClick={() => setTab('friends')}
        >
          {tReplace(lang, 'friendsTabList', friends.length)}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'requests'}
          className={`ui-tab ${tab === 'requests' ? 'ui-tab--active' : ''}`}
          onClick={() => setTab('requests')}
        >
          {t(lang, 'friendsTabRequests')} {pendingCount > 0 && `(${pendingCount})`}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'search'}
          className={`ui-tab ${tab === 'search' ? 'ui-tab--active' : ''}`}
          onClick={() => setTab('search')}
        >
          {t(lang, 'friendsTabSearch')}
        </button>
      </div>

      {loading ? (
        <div className="social-loading">
          <LoadingScreen label={t(lang, 'lbLoading')} />
        </div>
      ) : (
        <>
          {tab === 'friends' && (
            friends.length === 0 ? (
              <div className="ui-card ui-empty">
                <span className="ui-empty-icon" aria-hidden>👋</span>
                {t(lang, 'friendsEmpty')}
              </div>
            ) : (
              <div className="social-list">
                {friends.map(f => (
                  <div key={f.friendshipId} className="ui-card friend-item">
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
                        className="ui-btn ui-btn--sm"
                      >
                        {t(lang, 'friendsView')}
                      </Link>
                      <button
                        type="button"
                        className="ui-btn ui-btn--danger ui-btn--sm social-btn-danger"
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

          {tab === 'requests' && (
            <>
              {requests.received.length > 0 && (
                <section>
                  <h2 className="ui-section-title">
                    {tReplace(lang, 'friendsReceived', requests.received.length)}
                  </h2>
                  <div className="social-list">
                    {requests.received.map(r => (
                      <div key={r.friendshipId} className="ui-card friend-item">
                        <span className="friend-avatar">{r.user.avatar}</span>
                        <div className="friend-info">
                          <div className="friend-name">{r.user.name ?? r.user.email}</div>
                          <div className="friend-meta">{r.user.email}</div>
                        </div>
                        <div className="friend-actions">
                          <button
                            type="button"
                            className="ui-btn ui-btn--go ui-btn--sm social-btn-go"
                            onClick={() => handleAccept(r.friendshipId)}
                          >
                            {t(lang, 'friendsAccept')}
                          </button>
                          <button
                            type="button"
                            className="ui-btn ui-btn--danger ui-btn--sm social-btn-danger"
                            onClick={() => handleReject(r.friendshipId)}
                          >
                            {t(lang, 'friendsReject')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {requests.sent.length > 0 && (
                <section>
                  <h2 className="ui-section-title">
                    {tReplace(lang, 'friendsSent', requests.sent.length)}
                  </h2>
                  <div className="social-list">
                    {requests.sent.map(r => (
                      <div key={r.friendshipId} className="ui-card friend-item">
                        <span className="friend-avatar">{r.user.avatar}</span>
                        <div className="friend-info">
                          <div className="friend-name">{r.user.name ?? r.user.email}</div>
                          <div className="friend-meta">{t(lang, 'friendsWaiting')}</div>
                        </div>
                        <div className="friend-actions">
                          <button
                            type="button"
                            className="ui-btn ui-btn--sm"
                            onClick={() => handleReject(r.friendshipId)}
                          >
                            {t(lang, 'friendsCancel')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {requests.received.length === 0 && requests.sent.length === 0 && (
                <div className="ui-card ui-empty">
                  <span className="ui-empty-icon" aria-hidden>📬</span>
                  {t(lang, 'friendsNoRequests')}
                </div>
              )}
            </>
          )}

          {tab === 'search' && (
            <div className="ui-card">
              <form onSubmit={handleSearch} className="social-search">
                <input
                  className="ui-input"
                  type="email"
                  placeholder={t(lang, 'friendsSearchPlaceholder')}
                  aria-label={t(lang, 'friendsSearchPlaceholder')}
                  value={searchEmail}
                  onChange={e => {
                    setSearchEmail(e.target.value)
                    setSearchStatus('idle')
                  }}
                />
                <button
                  className="ui-btn ui-btn--primary ui-btn--block"
                  type="submit"
                  disabled={searchStatus === 'sending' || !searchEmail.trim()}
                >
                  {searchStatus === 'sending'
                    ? t(lang, 'friendsSearchSending')
                    : t(lang, 'friendsSearchBtn')}
                </button>
              </form>

              {searchStatus === 'sent' && (
                <p className="social-note social-note--ok" role="status">
                  {t(lang, 'friendsSearchSent')}
                </p>
              )}

              {searchStatus === 'error' && (
                <p className="social-note social-note--err" role="alert">
                  {searchError}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
