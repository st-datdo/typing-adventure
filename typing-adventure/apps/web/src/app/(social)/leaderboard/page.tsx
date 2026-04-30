'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { getLeaderboard, getFriendsLeaderboard } from '@/lib/api/leaderboard'
import { useSettingsStore } from '@/stores/settings-store'
import { t, tReplace } from '@typing-adventure/i18n'

interface LeaderboardEntry {
  rank: number
  userId: string
  name: string
  avatar: string
  wpm: number
  accuracy: number
  score: number
  isMe?: boolean
}

type Tab = 'global' | 'friends'
type Period = 'all' | 'weekly' | 'daily'

export default function LeaderboardPage() {
  const { data: session } = useSession()
  const lang = useSettingsStore(s => s.lang)
  const [tab, setTab] = useState<Tab>('global')
  const [mode, setMode] = useState('classic')
  const [level, setLevel] = useState('medium')
  const [period, setPeriod] = useState<Period>('all')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20

  const currentUserId = session?.user ? (session.user as { id: string }).id : null

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      if (tab === 'friends') {
        const res = await getFriendsLeaderboard({ mode, level })
        if (res.success && res.data) {
          setEntries(res.data)
          setTotal(res.data.length)
        } else {
          setEntries([])
          setTotal(0)
        }
      } else {
        const offset = (page - 1) * limit
        const res = await getLeaderboard({ mode, level, period, limit, offset })
        if (res.success && res.data) {
          setEntries(res.data)
          setTotal(res.meta?.total ?? res.data.length)
        } else {
          setEntries([])
          setTotal(0)
        }
      }
    } catch {
      setEntries([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [tab, mode, level, period, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    setPage(1)
  }, [tab, mode, level, period])

  const totalPages = Math.max(1, Math.ceil(total / limit))

  function rankIcon(rank: number) {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return String(rank)
  }

  function rankClass(rank: number) {
    if (rank === 1) return 'lb-rank lb-rank--gold'
    if (rank === 2) return 'lb-rank lb-rank--silver'
    if (rank === 3) return 'lb-rank lb-rank--bronze'
    return 'lb-rank'
  }

  const modeLabels: Record<string, string> = {
    classic: t(lang, 'modeClassic'),
    lesson: t(lang, 'modeLesson'),
    timeAttack: t(lang, 'modeTimeAttack'),
    challenge: t(lang, 'modeChallenge'),
  }

  const levelLabels: Record<string, string> = {
    easy: t(lang, 'lvEasy'),
    medium: t(lang, 'lvMedium'),
    hard: t(lang, 'lvHard'),
  }

  return (
    <div className="social-page">
      <Link href="/" className="social-back">
        {t(lang, 'backHome')}
      </Link>

      <div className="social-header">
        <h1 className="social-title">{t(lang, 'lbTitle')}</h1>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        <button
          className={`tab-btn ${tab === 'global' ? 'tab-btn--active' : ''}`}
          onClick={() => setTab('global')}
        >
          {t(lang, 'lbTabGlobal')}
        </button>
        <button
          className={`tab-btn ${tab === 'friends' ? 'tab-btn--active' : ''}`}
          onClick={() => setTab('friends')}
          disabled={!session}
          title={!session ? t(lang, 'lbLoginRequired') : undefined}
        >
          {t(lang, 'lbTabFriends')}
        </button>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <select
          className="filter-select"
          value={mode}
          onChange={e => setMode(e.target.value)}
        >
          {Object.entries(modeLabels).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={level}
          onChange={e => setLevel(e.target.value)}
        >
          {Object.entries(levelLabels).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>

        {tab === 'global' && (
          <div className="tab-bar" style={{ marginBottom: 0, flex: 1 }}>
            {(['all', 'weekly', 'daily'] as Period[]).map(p => (
              <button
                key={p}
                className={`tab-btn ${period === p ? 'tab-btn--active' : ''}`}
                onClick={() => setPeriod(p)}
              >
                {p === 'all'
                  ? t(lang, 'lbPeriodAll')
                  : p === 'weekly'
                    ? t(lang, 'lbPeriodWeekly')
                    : t(lang, 'lbPeriodDaily')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="social-empty">
          <div className="social-empty-icon">⏳</div>
          <div className="social-empty-text">{t(lang, 'lbLoading')}</div>
        </div>
      ) : entries.length === 0 ? (
        <div className="social-empty">
          <div className="social-empty-icon">💭</div>
          <div className="social-empty-text">
            {tab === 'friends'
              ? t(lang, 'lbEmptyFriends')
              : t(lang, 'lbEmptyGlobal')}
          </div>
        </div>
      ) : (
        <>
          <table className="lb-table">
            <thead>
              <tr>
                <th>{t(lang, 'lbColRank')}</th>
                <th>{t(lang, 'lbColPlayer')}</th>
                <th>{t(lang, 'lbColWpm')}</th>
                <th>{t(lang, 'lbColAccuracy')}</th>
                <th>{t(lang, 'lbColScore')}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => {
                const isMe = entry.isMe || entry.userId === currentUserId
                return (
                  <tr key={entry.userId} className={isMe ? 'lb-me' : ''}>
                    <td className={rankClass(entry.rank)}>
                      {rankIcon(entry.rank)}
                    </td>
                    <td>
                      <Link
                        href={`/profile/${entry.userId}`}
                        className="lb-user"
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <span className="lb-avatar">{entry.avatar}</span>
                        <span className="lb-name">
                          {entry.name}
                          {isMe && ` ${t(lang, 'lbYou')}`}
                        </span>
                      </Link>
                    </td>
                    <td className="lb-wpm">{entry.wpm}</td>
                    <td className="lb-accuracy">{entry.accuracy}%</td>
                    <td className="lb-score">{entry.score.toLocaleString()}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Pagination (global only) */}
          {tab === 'global' && totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                {t(lang, 'lbPrevPage')}
              </button>
              <span className="pagination-info">
                {tReplace(lang, 'lbPageInfo', page, totalPages)}
              </span>
              <button
                className="pagination-btn"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                {t(lang, 'lbNextPage')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
