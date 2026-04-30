'use client'

import { useState, useEffect, use } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { apiClient } from '@/lib/api/client'
import { sendFriendRequest, getFriends } from '@/lib/api/friends'
import { ACHIEVEMENTS } from '@typing-adventure/game-engine'
import { useSettingsStore } from '@/stores/settings-store'
import { t, tReplace } from '@typing-adventure/i18n'

interface ProfileData {
  id: string
  name: string | null
  avatar: string
  createdAt: string
  records: {
    bestWpm: Record<string, number>
    bestAccuracy: Record<string, number>
    bestScore: Record<string, number>
    totalGames: number
    totalWords: number
    dayStreak: number
    maxDayStreak: number
  } | null
  achievements: Array<{
    achievementId: string
    unlockedAt: string
  }>
}

interface RecentSession {
  wpm: number
  accuracy: number
  score: number
  level: string
  gameMode: string
  createdAt: string
}

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session } = useSession()
  const lang = useSettingsStore(s => s.lang)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [recentGames, setRecentGames] = useState<RecentSession[]>([])
  const [loading, setLoading] = useState(true)
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'friends' | 'self'>('none')
  const [addingFriend, setAddingFriend] = useState(false)

  const currentUserId = session?.user ? (session.user as { id: string }).id : null

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        // Fetch public profile
        const res = await apiClient<ProfileData>(`/api/users/${id}`)
        if (res.success && res.data) {
          setProfile(res.data)
        }

        // Fetch public recent sessions for this user
        const gamesRes = await apiClient<RecentSession[]>(
          `/api/users/${id}/sessions?limit=20`,
        )
        if (gamesRes.success && gamesRes.data) {
          setRecentGames(gamesRes.data)
        }

        // Check friendship status (only if logged in and viewing someone else)
        if (currentUserId && currentUserId !== id) {
          const friendsRes = await getFriends()
          if (friendsRes.success && friendsRes.data) {
            const isFriend = friendsRes.data.some(f => f.id === id)
            if (isFriend) {
              setFriendStatus('friends')
            } else {
              // Check pending requests too
              const reqRes = await apiClient<{
                received: Array<{ user: { id: string } }>
                sent: Array<{ user: { id: string } }>
              }>('/api/friends/requests')
              if (reqRes.success && reqRes.data) {
                const hasPending =
                  reqRes.data.sent.some(r => r.user.id === id) ||
                  reqRes.data.received.some(r => r.user.id === id)
                setFriendStatus(hasPending ? 'pending' : 'none')
              }
            }
          }
        } else if (currentUserId === id) {
          setFriendStatus('self')
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, currentUserId])

  async function handleAddFriend() {
    setAddingFriend(true)
    const res = await sendFriendRequest({ receiverId: id })
    if (res.success) {
      setFriendStatus('pending')
    }
    setAddingFriend(false)
  }

  if (loading) {
    return (
      <div className="social-page">
        <div className="social-empty">
          <div className="social-empty-icon">⏳</div>
          <div className="social-empty-text">{t(lang, 'lbLoading')}</div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="social-page">
        <Link href="/" className="social-back">{t(lang, 'backHome')}</Link>
        <div className="social-empty">
          <div className="social-empty-icon">🙅</div>
          <div className="social-empty-text">{t(lang, 'profileNotFound')}</div>
        </div>
      </div>
    )
  }

  const records = profile.records
  const unlockedIds = new Set(profile.achievements.map(a => a.achievementId))
  const unlockedAchievements = ACHIEVEMENTS.filter(a => unlockedIds.has(a.id))

  const maxWpm = records
    ? Math.max(records.bestWpm.easy ?? 0, records.bestWpm.medium ?? 0, records.bestWpm.hard ?? 0)
    : 0

  const maxAcc = records
    ? Math.max(records.bestAccuracy.easy ?? 0, records.bestAccuracy.medium ?? 0, records.bestAccuracy.hard ?? 0)
    : 0

  const maxChartWpm = Math.max(1, ...recentGames.map(g => g.wpm))

  return (
    <div className="social-page">
      <Link href="/leaderboard" className="social-back">
        {t(lang, 'backLeaderboard')}
      </Link>

      {/* Profile Card */}
      <div className="profile-card">
        <div className="profile-avatar-lg">{profile.avatar}</div>
        <div className="profile-name-lg">{profile.name ?? t(lang, 'profilePlayer')}</div>
        <div className="profile-joined">
          {tReplace(lang, 'profileJoined', new Date(profile.createdAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US'))}
        </div>
        {friendStatus === 'none' && currentUserId && (
          <button
            className="btn"
            onClick={handleAddFriend}
            disabled={addingFriend}
          >
            {addingFriend ? '⏳' : t(lang, 'profileAddFriend')}
          </button>
        )}
        {friendStatus === 'pending' && (
          <span className="profile-joined">{t(lang, 'profilePendingSent')}</span>
        )}
        {friendStatus === 'friends' && (
          <span className="profile-joined">{t(lang, 'profileIsFriend')}</span>
        )}
      </div>

      {/* Stats Grid */}
      <div className="profile-stats">
        <div className="profile-stat">
          <span className="profile-stat-value lb-wpm">{maxWpm}</span>
          <span className="profile-stat-label">{t(lang, 'profileBestWpm')}</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-value lb-accuracy">{maxAcc}%</span>
          <span className="profile-stat-label">{t(lang, 'profileBestAcc')}</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-value">{records?.totalGames ?? 0}</span>
          <span className="profile-stat-label">{t(lang, 'profileTotalGames')}</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-value">{records?.totalWords ?? 0}</span>
          <span className="profile-stat-label">{t(lang, 'profileTotalWords')}</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-value" style={{ color: '#ff5252' }}>
            {records?.maxDayStreak ?? 0}
          </span>
          <span className="profile-stat-label">{t(lang, 'profileMaxStreak')}</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-value" style={{ color: '#ff9800' }}>
            {records?.dayStreak ?? 0}
          </span>
          <span className="profile-stat-label">{t(lang, 'profileCurrentStreak')}</span>
        </div>
      </div>

      {/* Best records by level */}
      {records && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-dim)', marginBottom: 10 }}>
            {t(lang, 'profileRecordByLevel')}
          </h3>
          <div className="profile-stats">
            {(['easy', 'medium', 'hard'] as const).map(lvl => (
              <div key={lvl} className="profile-stat">
                <span className="profile-stat-value lb-wpm">
                  {records.bestWpm[lvl] ?? 0}
                </span>
                <span className="profile-stat-label">
                  {lvl} WPM
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WPM Chart (simple bars) */}
      {recentGames.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-dim)', marginBottom: 10 }}>
            {t(lang, 'profileRecentGames')}
          </h3>
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 3,
            height: 80,
            padding: '8px 0',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 'var(--radius-sm)',
            paddingInline: 8,
          }}>
            {recentGames.slice().reverse().map((g, i) => {
              const h = Math.max(4, (g.wpm / maxChartWpm) * 64)
              return (
                <div
                  key={i}
                  title={`WPM: ${g.wpm} | ${t(lang, 'lblAccuracy')}: ${g.accuracy}%`}
                  style={{
                    flex: 1,
                    height: h,
                    background: 'linear-gradient(to top, var(--color-accent), #e040fb)',
                    borderRadius: 2,
                    minWidth: 4,
                    transition: 'height 0.3s ease',
                  }}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Achievements Showcase */}
      {unlockedAchievements.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-dim)', marginBottom: 10 }}>
            {tReplace(lang, 'profileAchievements', unlockedAchievements.length, ACHIEVEMENTS.length)}
          </h3>
          <div className="profile-achievements">
            {unlockedAchievements.map(a => (
              <div key={a.id} className="profile-ach" title={t(lang, a.descKey as any)}>
                <span className="profile-ach-icon">{a.icon}</span>
                <span>{t(lang, a.nameKey as any)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
