'use client'

import { useState, useEffect, use } from 'react'
import { useSession } from 'next-auth/react'
import { apiClient } from '@/lib/api/client'
import { sendFriendRequest, getFriends } from '@/lib/api/friends'
import { ACHIEVEMENTS } from '@typing-adventure/game-engine'
import { useSettingsStore } from '@/stores/settings-store'
import { t, tReplace } from '@typing-adventure/i18n'
import type { TranslationKey } from '@typing-adventure/i18n'
import { TopBar } from '@/components/ui/TopBar'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

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
  raceResults: Array<{
    wpm: number
    accuracy: number
    position: number
    finishTime: number | null
    createdAt: string
    room: {
      code: string
      level: string
      maxPlayers: number
      _count: { results: number }
    }
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
    return <LoadingScreen label={t(lang, 'lbLoading')} />
  }

  if (!profile) {
    return (
      <div className="ui-page social-page">
        <TopBar back={{ href: '/', label: t(lang, 'backHome').replace('← ', '') }} title={t(lang, 'profileTitle')} />
        <div className="ui-card ui-empty">
          <span className="ui-empty-icon" aria-hidden>🙅</span>
          {t(lang, 'profileNotFound')}
        </div>
      </div>
    )
  }

  const records = profile.records
  const unlockedIds = new Set(profile.achievements.map(a => a.achievementId))
  const unlockedAchievements = ACHIEVEMENTS.filter(a => unlockedIds.has(a.id))
  const raceResults = profile.raceResults ?? []
  const raceWins = raceResults.filter(r => r.position === 1).length
  const raceLosses = raceResults.length - raceWins

  const maxWpm = records
    ? Math.max(records.bestWpm.easy ?? 0, records.bestWpm.medium ?? 0, records.bestWpm.hard ?? 0)
    : 0

  const maxAcc = records
    ? Math.max(records.bestAccuracy.easy ?? 0, records.bestAccuracy.medium ?? 0, records.bestAccuracy.hard ?? 0)
    : 0

  const maxChartWpm = Math.max(1, ...recentGames.map(g => g.wpm))

  return (
    <div className="ui-page social-page">
      <TopBar
        back={{ href: '/leaderboard', label: t(lang, 'backLeaderboard').replace('← ', '') }}
        title={t(lang, 'profileTitle')}
      />

      <div className="ui-card profile-card">
        <div className="profile-avatar-lg">{profile.avatar}</div>
        <div className="profile-name-lg">{profile.name ?? t(lang, 'profilePlayer')}</div>
        <div className="profile-joined">
          {tReplace(lang, 'profileJoined', new Date(profile.createdAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US'))}
        </div>
        {friendStatus === 'none' && currentUserId && (
          <button
            type="button"
            className="ui-btn ui-btn--primary"
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

      <div className="profile-stats">
        <div className="ui-card profile-stat">
          <span className="profile-stat-value lb-wpm">{maxWpm}</span>
          <span className="profile-stat-label">{t(lang, 'profileBestWpm')}</span>
        </div>
        <div className="ui-card profile-stat">
          <span className="profile-stat-value lb-accuracy">{maxAcc}%</span>
          <span className="profile-stat-label">{t(lang, 'profileBestAcc')}</span>
        </div>
        <div className="ui-card profile-stat">
          <span className="profile-stat-value">{records?.totalGames ?? 0}</span>
          <span className="profile-stat-label">{t(lang, 'profileTotalGames')}</span>
        </div>
        <div className="ui-card profile-stat">
          <span className="profile-stat-value">{records?.totalWords ?? 0}</span>
          <span className="profile-stat-label">{t(lang, 'profileTotalWords')}</span>
        </div>
        <div className="ui-card profile-stat">
          <span className="profile-stat-value profile-stat-value--streak">
            {records?.maxDayStreak ?? 0}
          </span>
          <span className="profile-stat-label">{t(lang, 'profileMaxStreak')}</span>
        </div>
        <div className="ui-card profile-stat">
          <span className="profile-stat-value profile-stat-value--today">
            {records?.dayStreak ?? 0}
          </span>
          <span className="profile-stat-label">{t(lang, 'profileCurrentStreak')}</span>
        </div>
      </div>

      {records && (
        <section className="ui-card profile-section">
          <h2 className="ui-section-title">{t(lang, 'profileRecordByLevel')}</h2>
          <div className="profile-stats">
            {(['easy', 'medium', 'hard'] as const).map(lvl => (
              <div key={lvl} className="ui-card ui-card--inset profile-stat">
                <span className="profile-stat-value lb-wpm">
                  {records.bestWpm[lvl] ?? 0}
                </span>
                <span className="profile-stat-label profile-label-cap">
                  {lvl} WPM
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {recentGames.length > 0 && (
        <section className="ui-card profile-section">
          <h2 className="ui-section-title">{t(lang, 'profileRecentGames')}</h2>
          <div className="ui-card--inset profile-chart">
            {recentGames.slice().reverse().map((g, i) => (
              <div
                key={i}
                className="profile-chart-bar"
                title={`WPM: ${g.wpm} | ${t(lang, 'lblAccuracy')}: ${g.accuracy}%`}
                style={{ height: Math.max(4, (g.wpm / maxChartWpm) * 72) }}
              />
            ))}
          </div>
        </section>
      )}

      {unlockedAchievements.length > 0 && (
        <section className="ui-card profile-section">
          <h2 className="ui-section-title">
            {tReplace(lang, 'profileAchievements', unlockedAchievements.length, ACHIEVEMENTS.length)}
          </h2>
          <div className="profile-achievements">
            {unlockedAchievements.map(a => (
              <div key={a.id} className="profile-ach" title={t(lang, a.descKey as TranslationKey)}>
                <span className="profile-ach-icon">{a.icon}</span>
                <span>{t(lang, a.nameKey as TranslationKey)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {raceResults.length > 0 && (
        <section className="ui-card profile-section">
          <h2 className="ui-section-title">
            {lang === 'vi' ? 'Lich su dua' : 'Race History'}
            <span>{raceWins}W / {raceLosses}L</span>
          </h2>
          <table className="social-table">
            <thead>
              <tr>
                <th>{lang === 'vi' ? 'Thu hang' : 'Rank'}</th>
                <th>WPM</th>
                <th>Acc</th>
                <th>Level</th>
                <th>{lang === 'vi' ? 'Ngay' : 'Date'}</th>
              </tr>
            </thead>
            <tbody>
              {raceResults.map((r, i) => {
                const medal = r.position === 1 ? '🥇' : r.position === 2 ? '🥈' : r.position === 3 ? '🥉' : `#${r.position}`
                return (
                  <tr key={i}>
                    <td>
                      {medal}
                      <span className="social-table-of">/{r.room._count.results}</span>
                    </td>
                    <td className="lb-wpm">{r.wpm}</td>
                    <td>{r.accuracy}%</td>
                    <td className="profile-label-cap">{r.room.level}</td>
                    <td className="social-table-dim">
                      {new Date(r.createdAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}
