'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api/client'

const KEYBOARD_ROWS = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
  [' '],
]

type Period = 'daily' | 'weekly' | 'monthly' | 'all'

function heatColor(ratio: number): string {
  // 0 = cool green, 0.5 = yellow, 1 = hot red
  if (ratio <= 0) return 'rgba(74, 222, 128, 0.15)'
  if (ratio < 0.25) return `rgba(74, 222, 128, ${0.2 + ratio * 1.2})`
  if (ratio < 0.5) return `rgba(250, 204, 21, ${0.3 + ratio * 0.8})`
  if (ratio < 0.75) return `rgba(251, 146, 60, ${0.4 + ratio * 0.5})`
  return `rgba(239, 68, 68, ${0.5 + ratio * 0.4})`
}

function textColor(ratio: number): string {
  if (ratio < 0.3) return 'var(--color-text-dim)'
  return '#fff'
}

export default function HeatmapPage() {
  const [data, setData] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('weekly')

  useEffect(() => {
    setLoading(true)
    apiClient<Record<string, number>>(
      `/api/analytics/mistake-heatmap?period=${period}`,
    ).then((res) => {
      if (res.success && res.data) setData(res.data)
      setLoading(false)
    })
  }, [period])

  const values = Object.values(data)
  const maxCount = Math.max(...values, 1)
  const totalMistakes = values.reduce((sum, v) => sum + v, 0)

  // Top 5 most mistaken keys
  const topKeys = Object.entries(data)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  if (loading) return <div className="admin-loading">Loading heatmap...</div>

  return (
    <div>
      <div className="dashboard-header">
        <h1 className="admin-page-title">🔥 Mistake Heatmap</h1>
        <div className="dashboard-period-selector">
          {(['daily', 'weekly', 'monthly', 'all'] as Period[]).map((p) => (
            <button
              key={p}
              className={`period-btn ${period === p ? 'active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-card-icon">❌</div>
          <div className="stat-card-value">{totalMistakes}</div>
          <div className="stat-card-label">Total Mistakes</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">🔤</div>
          <div className="stat-card-value">{Object.keys(data).length}</div>
          <div className="stat-card-label">Unique Keys</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">🏆</div>
          <div className="stat-card-value">
            {topKeys[0] ? (topKeys[0][0] === ' ' ? '␣' : topKeys[0][0]) : '—'}
          </div>
          <div className="stat-card-label">Most Mistaken</div>
        </div>
      </div>

      {/* Keyboard Heatmap */}
      <div className="chart-card" style={{ marginBottom: 24 }}>
        <div className="chart-card-title">Keyboard Layout</div>
        <div className="heatmap-keyboard">
          {KEYBOARD_ROWS.map((row, ri) => (
            <div key={ri} className="heatmap-row">
              {row.map((key) => {
                const count = data[key] ?? 0
                const ratio = count / maxCount
                const isSpace = key === ' '
                return (
                  <div
                    key={key}
                    className="heatmap-key"
                    style={{
                      background: heatColor(ratio),
                      color: textColor(ratio),
                      width: isSpace ? 260 : 44,
                      borderColor:
                        ratio > 0.5
                          ? 'rgba(239, 68, 68, 0.3)'
                          : 'rgba(255, 255, 255, 0.1)',
                    }}
                    title={`${isSpace ? 'Space' : key}: ${count} mistakes`}
                  >
                    {isSpace ? '␣ Space' : key.toUpperCase()}
                    {count > 0 && (
                      <span className="heatmap-key-count">{count}</span>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
          <div className="heatmap-legend">
            <span>Few mistakes</span>
            <div className="heatmap-legend-gradient" />
            <span>Many mistakes</span>
          </div>
        </div>
      </div>

      {/* Top Mistakes Table */}
      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-card-title">Top Mistake Keys</div>
          <div className="top-packs-list">
            {topKeys.map(([key, count], i) => (
              <div key={key} className="top-pack-row">
                <span className="top-pack-rank">#{i + 1}</span>
                <span
                  className="top-pack-name"
                  style={{ fontFamily: 'monospace', fontSize: '1.1rem' }}
                >
                  {key === ' ' ? '␣' : key.toUpperCase()}
                </span>
                <div className="top-pack-bar-bg">
                  <div
                    className="top-pack-bar-fill"
                    style={{
                      width: `${(count / maxCount) * 100}%`,
                      background:
                        i === 0
                          ? 'var(--color-wrong)'
                          : i < 3
                            ? '#fb923c'
                            : 'var(--color-accent)',
                    }}
                  />
                </div>
                <span className="top-pack-count">{count}x</span>
              </div>
            ))}
            {topKeys.length === 0 && (
              <div className="empty-state">No mistake data yet</div>
            )}
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-card-title">Mistake Distribution</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-dim)' }}>
            {totalMistakes > 0 ? (
              <div className="top-packs-list">
                {[
                  {
                    label: 'Letters',
                    count: Object.entries(data)
                      .filter(([k]) => /^[a-z]$/i.test(k))
                      .reduce((s, [, v]) => s + v, 0),
                  },
                  {
                    label: 'Numbers',
                    count: Object.entries(data)
                      .filter(([k]) => /^[0-9]$/.test(k))
                      .reduce((s, [, v]) => s + v, 0),
                  },
                  {
                    label: 'Symbols',
                    count: Object.entries(data)
                      .filter(([k]) => !/^[a-z0-9 ]$/i.test(k))
                      .reduce((s, [, v]) => s + v, 0),
                  },
                  {
                    label: 'Space',
                    count: data[' '] ?? 0,
                  },
                ].map((cat) => (
                  <div key={cat.label} className="top-pack-row">
                    <span className="top-pack-name">{cat.label}</span>
                    <div className="top-pack-bar-bg">
                      <div
                        className="top-pack-bar-fill"
                        style={{
                          width: `${(cat.count / totalMistakes) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="top-pack-count">
                      {cat.count} ({Math.round((cat.count / totalMistakes) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">No data yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
