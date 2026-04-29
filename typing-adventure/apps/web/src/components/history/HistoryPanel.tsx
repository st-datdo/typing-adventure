'use client'

import { useSettingsStore } from '@/stores/settings-store'
import { useRecordsStore } from '@/stores/records-store'
import { t, tReplace } from '@typing-adventure/i18n'

interface HistoryPanelProps {
  onClose: () => void
}

export function HistoryPanel({ onClose }: HistoryPanelProps) {
  const lang = useSettingsStore(s => s.lang)
  const records = useRecordsStore(s => s.records)
  const history = useRecordsStore(s => s.history)

  const recent = history.slice(0, 20)

  // WPM trend
  let trendEl = null
  if (recent.length >= 2) {
    const lastWpm = recent[0].wpm
    const prevWpm = recent[1].wpm
    const diff = lastWpm - prevWpm
    if (diff > 0) {
      trendEl = (
        <div className="history-trend trend--up">
          <span className="trend-icon">📈</span>
          {tReplace(lang, 'trendUp', Math.abs(diff))}
        </div>
      )
    } else if (diff < 0) {
      trendEl = (
        <div className="history-trend trend--down">
          <span className="trend-icon">📉</span>
          {tReplace(lang, 'trendDown', Math.abs(diff))}
        </div>
      )
    } else {
      trendEl = (
        <div className="history-trend trend--stable">
          <span className="trend-icon">➡️</span>
          {t(lang, 'trendStable')}
        </div>
      )
    }
  }

  // Simple SVG chart
  const chartData = [...recent].reverse().slice(-10)
  const maxWpm = Math.max(...chartData.map(d => d.wpm), 1)
  const chartW = 400
  const chartH = 120
  const padding = 20

  return (
    <div className="settings-overlay settings--visible" onClick={(e) => {
      if (e.target === e.currentTarget) onClose()
    }}>
      <div className="settings-panel history-panel">
        <div className="settings-header">
          <h2 className="settings-title">{t(lang, 'historyTitle')}</h2>
          <button className="settings-close" onClick={onClose}>✕</button>
        </div>

        <div className="settings-body">
          {/* Streak */}
          <div className="history-streak">
            <span className="streak-fire">🔥</span>{' '}
            {tReplace(lang, 'streakDays', records.dayStreak)}
            <br />
            <span className="streak-sub">
              {tReplace(lang, 'gamesPlayed', records.totalGames)} | {tReplace(lang, 'wordsTyped', records.totalWords)}
            </span>
          </div>

          {/* Chart */}
          {chartData.length >= 2 ? (
            <div className="history-chart-section">
              <div className="history-section-title">{t(lang, 'chartTitle')}</div>
              <svg className="history-chart" viewBox={`0 0 ${chartW} ${chartH + 20}`}>
                <polyline
                  fill="none"
                  stroke="var(--color-accent)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={chartData.map((d, i) => {
                    const x = padding + (i / (chartData.length - 1)) * (chartW - padding * 2)
                    const y = chartH - padding - ((d.wpm / maxWpm) * (chartH - padding * 2))
                    return `${x},${y}`
                  }).join(' ')}
                />
                {chartData.map((d, i) => {
                  const x = padding + (i / (chartData.length - 1)) * (chartW - padding * 2)
                  const y = chartH - padding - ((d.wpm / maxWpm) * (chartH - padding * 2))
                  return (
                    <g key={i}>
                      <circle cx={x} cy={y} r="4" fill="var(--color-accent)" />
                      <text x={x} y={y - 8} textAnchor="middle" fontSize="10" fill="var(--color-text-dim)">
                        {d.wpm}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>
          ) : (
            <div className="history-empty">{t(lang, 'chartMin')}</div>
          )}

          {/* Trend */}
          {trendEl}

          {/* Recent games table */}
          <div>
            <div className="history-section-title">{t(lang, 'recentTitle')}</div>
            {recent.length === 0 ? (
              <div className="history-empty">{t(lang, 'emptyHistory')}</div>
            ) : (
              <div className="history-table-wrap">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>{t(lang, 'thDate')}</th>
                      <th>{t(lang, 'thLevel')}</th>
                      <th>WPM</th>
                      <th>{t(lang, 'thAcc')}</th>
                      <th>{t(lang, 'thStars')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((g, i) => (
                      <tr key={i}>
                        <td>{new Date(g.date).toLocaleDateString()}</td>
                        <td>{g.level}</td>
                        <td>{g.wpm}</td>
                        <td>{g.accuracy}%</td>
                        <td className="stars-cell">
                          {'★'.repeat(g.stars)}{'☆'.repeat(3 - g.stars)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
