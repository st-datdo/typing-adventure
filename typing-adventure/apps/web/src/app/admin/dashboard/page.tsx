'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api/client'

interface AdminStats {
  totalUsers: number
  totalSessions: number
  sessionsToday: number
  avgWpm: number
  dailySessions: { date: string; count: number }[]
  userGrowth: { date: string; count: number }[]
}

function BarChart({ data, color }: { data: { date: string; count: number }[]; color?: string }) {
  const maxVal = Math.max(...data.map((d) => d.count), 1)
  return (
    <div className="chart-bars">
      {data.map((d) => (
        <div key={d.date} className="chart-bar-wrap">
          <div className="chart-bar-value">{d.count}</div>
          <div
            className="chart-bar"
            style={{
              height: `${(d.count / maxVal) * 100}%`,
              background: color ?? 'var(--color-accent)',
            }}
          />
          <div className="chart-bar-label">{d.date.slice(5)}</div>
        </div>
      ))}
    </div>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient<AdminStats>('/api/admin/stats').then((res) => {
      if (res.success && res.data) setStats(res.data)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="admin-loading">Loading dashboard...</div>
  if (!stats) return <div className="admin-loading">Failed to load stats.</div>

  return (
    <div>
      <h1 className="admin-page-title">📊 Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon">👥</div>
          <div className="stat-card-value">{stats.totalUsers}</div>
          <div className="stat-card-label">Total Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">🎮</div>
          <div className="stat-card-value">{stats.totalSessions}</div>
          <div className="stat-card-label">Total Sessions</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">📅</div>
          <div className="stat-card-value">{stats.sessionsToday}</div>
          <div className="stat-card-label">Sessions Today</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">⚡</div>
          <div className="stat-card-value">{stats.avgWpm}</div>
          <div className="stat-card-label">Avg WPM</div>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-card-title">Sessions / Day (Last 7 days)</div>
          <BarChart data={stats.dailySessions} />
        </div>
        <div className="chart-card">
          <div className="chart-card-title">User Growth (Last 7 days)</div>
          <BarChart data={stats.userGrowth} color="var(--color-correct)" />
        </div>
      </div>
    </div>
  )
}
