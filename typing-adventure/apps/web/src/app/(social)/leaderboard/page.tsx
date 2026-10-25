'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { getLeaderboard, getFriendsLeaderboard } from '@/lib/api/leaderboard'
import { useSettingsStore } from '@/stores/settings-store'
import { t, tReplace } from '@typing-adventure/i18n'
import { TopBar } from '@/components/ui/TopBar'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

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

  function medalClass(rank: number) {
    if (rank === 1) return ' lb-row--gold'
    if (rank === 2) return ' lb-row--silver'
    if (rank === 3) return ' lb-row--bronze'
    return ''
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
    <div className="ui-page social-page">
      <TopBar back={{ href: '/', label: t(lang, 'backHome').replace('← ', '') }} title={t(lang, 'lbTitle')} />

      <div className="ui-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'global'}
          className={`ui-tab ${tab === 'global' ? 'ui-tab--active' : ''}`}
          onClick={() => setTab('global')}
        >
          {t(lang, 'lbTabGlobal')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'friends'}
          className={`ui-tab ${tab === 'friends' ? 'ui-tab--active' : ''}`}
          onClick={() => setTab('friends')}
          disabled={!session}
          title={!session ? t(lang, 'lbLoginRequired') : undefined}
        >
          {t(lang, 'lbTabFriends')}
        </button>
      </div>

      <div className="social-filters">
        <select
          className="ui-select"
          value={mode}
          onChange={e => setMode(e.target.value)}
        >
          {Object.entries(modeLabels).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>

        <select
          className="ui-select"
          value={level}
          onChange={e => setLevel(e.target.value)}
        >
          {Object.entries(levelLabels).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>

        {tab === 'global' && (
          <div className="ui-tabs" role="tablist">
            {(['all', 'weekly', 'daily'] as Period[]).map(p => (
              <button
                key={p}
                type="button"
                role="tab"
                aria-selected={period === p}
                className={`ui-tab ${period === p ? 'ui-tab--active' : ''}`}
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

      {loading ? (
        <div className="social-loading">
          <LoadingScreen label={t(lang, 'lbLoading')} />
        </div>
      ) : entries.length === 0 ? (
        <div className="ui-card ui-empty">
          <span className="ui-empty-icon" aria-hidden>💭</span>
          {tab === 'friends'
            ? t(lang, 'lbEmptyFriends')
            : t(lang, 'lbEmptyGlobal')}
        </div>
      ) : (
        <>
          <div className="lb-head" aria-hidden>
            <span>{t(lang, 'lbColRank')}</span>
            <span>{t(lang, 'lbColPlayer')}</span>
            <span>{t(lang, 'lbColWpm')}</span>
            <span>{t(lang, 'lbColAccuracy')}</span>
            <span>{t(lang, 'lbColScore')}</span>
          </div>
          <ol className="lb-list">
            {entries.map(entry => {
              const isMe = entry.isMe || entry.userId === currentUserId
              return (
                <li
                  key={entry.userId}
                  className={`ui-card lb-row${medalClass(entry.rank)}${isMe ? ' lb-row--me' : ''}`}
                >
                  <span className="lb-rank">{rankIcon(entry.rank)}</span>
                  <Link href={`/profile/${entry.userId}`} className="lb-user">
                    <span className="lb-avatar">{entry.avatar}</span>
                    <span className="lb-name">
                      {entry.name}
                      {isMe && <span className="lb-you">{` ${t(lang, 'lbYou')}`}</span>}
                    </span>
                  </Link>
                  <span className="lb-wpm" title={t(lang, 'lbColWpm')}>{entry.wpm}</span>
                  <span className="lb-accuracy" title={t(lang, 'lbColAccuracy')}>{entry.accuracy}%</span>
                  <span className="lb-score" title={t(lang, 'lbColScore')}>{entry.score.toLocaleString()}</span>
                </li>
              )
            })}
          </ol>

          {tab === 'global' && totalPages > 1 && (
            <div className="social-pager">
              <button
                type="button"
                className="ui-btn ui-btn--sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                {t(lang, 'lbPrevPage')}
              </button>
              <span className="social-pager-info">
                {tReplace(lang, 'lbPageInfo', page, totalPages)}
              </span>
              <button
                type="button"
                className="ui-btn ui-btn--sm"
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
