'use client'

import { useEffect, useState } from 'react'
import type { GameState } from '@typing-adventure/game-engine'
import { formatTime, AGE_PROFILES } from '@typing-adventure/game-engine'
import { useSettingsStore } from '@/stores/settings-store'
import { useRecordsStore } from '@/stores/records-store'
import { t } from '@typing-adventure/i18n'

interface StatsBarProps {
  gameState: GameState
}

export function StatsBar({ gameState }: StatsBarProps) {
  const lang = useSettingsStore(s => s.lang)
  const ageGroup = useSettingsStore(s => s.ageGroup)
  const showSpeed = ageGroup === null || AGE_PROFILES[ageGroup].showSpeedStats
  const records = useRecordsStore(s => s.records)
  const [liveStats, setLiveStats] = useState({ time: '0:00', cps: '0.00', wpm: 0, accuracy: 100 })

  useEffect(() => {
    const interval = setInterval(() => {
      if (!gameState.startTime || gameState.isFinished) return

      const elapsed = (Date.now() - gameState.startTime) / 1000
      const cps = elapsed > 0 ? gameState.correctKeystrokes / elapsed : 0
      const wpm = elapsed > 0
        ? Math.round((gameState.correctKeystrokes / 5) / (elapsed / 60))
        : 0
      const accuracy = gameState.totalKeystrokes > 0
        ? Math.round((gameState.correctKeystrokes / gameState.totalKeystrokes) * 100)
        : 100

      const displayTime = gameState.gameMode === 'timeAttack'
        ? formatTime(Math.max(0, gameState.timeAttackDuration - elapsed))
        : formatTime(elapsed)

      setLiveStats({ time: displayTime, cps: cps.toFixed(2), wpm, accuracy })
    }, 100)

    return () => clearInterval(interval)
  }, [gameState.startTime, gameState.isFinished, gameState.correctKeystrokes, gameState.totalKeystrokes, gameState.gameMode, gameState.timeAttackDuration])

  const bestWpm = records.bestWpm[gameState.level] ?? 0

  const allStats = [
    { cls: 'stat-time', icon: '⏳', label: t(lang, 'lblTime'), value: liveStats.time, tip: t(lang, 'tipTime') },
    { cls: 'stat-cps', icon: '⚡', label: 'CPS', value: liveStats.cps, tip: t(lang, 'tipCps') },
    { cls: 'stat-wpm', icon: '🚀', label: 'WPM', value: liveStats.wpm, tip: t(lang, 'tipWpm') },
    { cls: 'stat-accuracy', icon: '🎯', label: t(lang, 'lblAccuracy'), value: `${liveStats.accuracy}%`, tip: t(lang, 'tipAccuracy') },
    { cls: 'stat-score', icon: '💰', label: t(lang, 'lblScore'), value: gameState.score.toLocaleString(), tip: t(lang, 'tipScore') },
    { cls: 'stat-best', icon: '👑', label: t(lang, 'lblBest'), value: bestWpm, tip: t(lang, 'tipBest') },
    { cls: 'stat-streak', icon: '🔥', label: 'Streak', value: `${records.dayStreak} ${t(lang, 'dayUnit')}`, tip: t(lang, 'tipStreak') },
  ]
  const speedOnly = ['stat-cps', 'stat-wpm', 'stat-best']
  const stats = showSpeed ? allStats : allStats.filter(s => !speedOnly.includes(s.cls))

  return (
    <section className={`stats-bar ${showSpeed ? '' : 'stats-bar--compact'}`}>
      {stats.map(s => (
        <div key={s.cls} className={`stat-card ${s.cls} has-tooltip`} data-tooltip={s.tip}>
          <div className="stat-icon">{s.icon}</div>
          <div className="stat-info">
            <span className="stat-label">{s.label}</span>
            <span className="stat-value">{s.value}</span>
          </div>
        </div>
      ))}
    </section>
  )
}
