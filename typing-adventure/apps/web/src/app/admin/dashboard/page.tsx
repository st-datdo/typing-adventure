'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api/client'

interface AdminStats {
  totalUsers: number
  totalSessions: number
  sessionsToday: number
  avgWpm: number
  dau: number
  wau: number
  mau: number
  dailySessions: { date: string; count: number }[]
  userGrowth: { date: string; count: number }[]
  wpmTrend: { date: string; avgWpm: number }[]
  topWordPacks: { gameMode: string; count: number }[]
  activeRooms: {
    id: string
    code: string
    status: string
    level: string
    maxPlayers: number
    playerCount: number
    createdAt: string
  }[]
}

function BarChart({
  data,
  valueKey = 'count',
  color,
}: {
  data: Record<string, unknown>[]
  valueKey?: string
  color?: string
}) {
  const values = data.map((d) => (d[valueKey] as number) ?? 0)
  const maxVal = Math.max(...values, 1)
  return (
    <div className="chart-bars">
      {data.map((d, i) => (
        <div key={i} className="chart-bar-wrap">
          <div className="chart-bar-value">{values[i]}</div>
          <div
            className="chart-bar"
            style={{
              height: `${(values[i] / maxVal) * 100}%`,
              background: color ?? 'var(--color-accent)',
            }}
          />
          <div className="chart-bar-label">
            {((d.date as string) ?? '').slice(5)}
          </div>
        </div>
      ))}
    </div>
  )
}

function SparkLine({
  data,
  valueKey = 'count',
  color = 'var(--color-accent)',
  height = 60,
}: {
  data: Record<string, unknown>[]
  valueKey?: string
  color?: string
  height?: number
}) {
  const values = data.map((d) => (d[valueKey] as number) ?? 0)
  const maxVal = Math.max(...values, 1)
  const width = 300
  const points = values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * width
      const y = height - (v / maxVal) * (height - 4) - 2
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="spark-line"
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <polyline
        points={`0,${height} ${points} ${width},${height}`}
        fill={color}
        opacity="0.1"
      />
    </svg>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    WAITING: 'var(--color-accent)',
    COUNTDOWN: '#f59e0b',
    RACING: 'var(--color-correct)',
  }
  return (
    <span
      className="admin-badge"
      style={{
        background: `${colorMap[status] ?? '#888'}22`,
        color: colorMap[status] ?? '#888',
      }}
    >
      {status}
    </span>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  useEffect(() => {
    setLoading(true)
    apiClient<AdminStats>(`/api/admin/stats?days=${days}`).then((res) => {
      if (res.success && res.data) setStats(res.data)
      setLoading(false)
    })
  }, [days])

  if (loading) return <div className="admin-loading">Loading dashboard...</div>
  if (!stats) return <div className="admin-loading">Failed to load stats.</div>

  return (
    <div>
      <div className="dashboard-header">
        <h1 className="admin-page-title">📊 Dashboard</h1>
        <div className="dashboard-period-selector">
          {[7, 14, 30, 60].map((d) => (
            <button
              key={d}
              className={`period-btn ${days === d ? 'active' : ''}`}
              onClick={() => setDays(d)}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* DAU / WAU / MAU */}
      <div className="stats-grid stats-grid-6">
        <div className="stat-card">
          <div className="stat-card-icon">👥</div>
          <div className="stat-card-value">{stats.totalUsers}</div>
          <div className="stat-card-label">Total Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">📅</div>
          <div className="stat-card-value">{stats.dau}</div>
          <div className="stat-card-label">DAU</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">📆</div>
          <div className="stat-card-value">{stats.wau}</div>
          <div className="stat-card-label">WAU</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">🗓️</div>
          <div className="stat-card-value">{stats.mau}</div>
          <div className="stat-card-label">MAU</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">🎮</div>
          <div className="stat-card-value">{stats.totalSessions}</div>
          <div className="stat-card-label">Total Sessions</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">⚡</div>
          <div className="stat-card-value">{stats.avgWpm}</div>
          <div className="stat-card-label">Avg WPM</div>
        </div>
      </div>

      {/* Charts Row 1: Sessions + User Growth */}
      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-card-title">
            Sessions / Day ({days} days)
            <span className="chart-card-total">
              Today: {stats.sessionsToday}
            </span>
          </div>
          <BarChart data={stats.dailySessions} />
        </div>
        <div className="chart-card">
          <div className="chart-card-title">User Registration Trend</div>
          <BarChart data={stats.userGrowth} color="var(--color-correct)" />
        </div>
      </div>

      {/* Charts Row 2: WPM Trend + Top Word Packs */}
      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-card-title">Average WPM Trend</div>
          <SparkLine
            data={stats.wpmTrend}
            valueKey="avgWpm"
            color="var(--color-accent)"
            height={80}
          />
          <div className="wpm-trend-labels">
            {stats.wpmTrend.length > 0 && (
              <>
                <span>{stats.wpmTrend[0].date.slice(5)}</span>
                <span>
                  {stats.wpmTrend[stats.wpmTrend.length - 1].date.slice(5)}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-card-title">Top Game Modes (Most Played)</div>
          <div className="top-packs-list">
            {stats.topWordPacks.map((wp, i) => {
              const maxCount = stats.topWordPacks[0]?.count ?? 1
              return (
                <div key={wp.gameMode} className="top-pack-row">
                  <span className="top-pack-rank">#{i + 1}</span>
                  <span className="top-pack-name">{wp.gameMode}</span>
                  <div className="top-pack-bar-bg">
                    <div
                      className="top-pack-bar-fill"
                      style={{
                        width: `${(wp.count / maxCount) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="top-pack-count">{wp.count}</span>
                </div>
              )
            })}
            {stats.topWordPacks.length === 0 && (
              <div className="empty-state">No data yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Active Race Rooms */}
      <div className="chart-card" style={{ marginBottom: 32 }}>
        <div className="chart-card-title">
          Active Race Rooms
          <span className="chart-card-total">
            {stats.activeRooms.length} active
          </span>
        </div>
        {stats.activeRooms.length > 0 ? (
          <div className="admin-table-wrap" style={{ border: 'none' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Status</th>
                  <th>Level</th>
                  <th>Players</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {stats.activeRooms.map((room) => (
                  <tr key={room.id}>
                    <td>
                      <code className="room-code">{room.code}</code>
                    </td>
                    <td>
                      <StatusBadge status={room.status} />
                    </td>
                    <td>{room.level}</td>
                    <td>
                      {room.playerCount}/{room.maxPlayers}
                    </td>
                    <td className="text-dim">
                      {new Date(room.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">No active race rooms</div>
        )}
      </div>
    </div>
  )
}
