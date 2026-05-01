'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSettingsStore } from '@/stores/settings-store'
import { t } from '@typing-adventure/i18n'
import { LESSONS } from '@typing-adventure/game-engine'
import type { GameMode, Level, SoundMode, Lang } from '@typing-adventure/game-engine'
import { getWordPacks, type WordPackSummary } from '@/lib/api/wordpacks'

interface SideNavProps {
  gameMode: GameMode
  lessonIndex: number
  timeAttackDuration: number
  selectedWordPackId: string | null
  onModeChange: (mode: GameMode) => void
  onLevelChange: (level: Level) => void
  onLessonChange: (index: number) => void
  onTimeAttackChange: (duration: number) => void
  onWordPackChange: (packId: string | null, words: string[] | undefined) => void
  onRestart: () => void
  onOpenSettings: () => void
  onOpenHistory: () => void
}

export function SideNav({
  gameMode,
  lessonIndex,
  timeAttackDuration,
  selectedWordPackId,
  onModeChange,
  onLevelChange,
  onLessonChange,
  onTimeAttackChange,
  onWordPackChange,
  onRestart,
  onOpenSettings,
  onOpenHistory,
}: SideNavProps) {
  const settings = useSettingsStore()
  const lang = settings.lang
  const [wordPacks, setWordPacks] = useState<WordPackSummary[]>([])

  useEffect(() => {
    getWordPacks().then((res) => {
      if (res.success && res.data) setWordPacks(res.data)
    })
  }, [])

  const handleWordPackSelect = (packId: string) => {
    if (packId === 'default') {
      onWordPackChange(null, undefined)
    } else {
      const pack = wordPacks.find((p) => p.id === packId)
      onWordPackChange(packId, pack?.words)
    }
  }

  // Filter packs by current level
  const filteredPacks = wordPacks.filter(
    (p) => p.level === settings.level || p.isDefault === false,
  )

  return (
    <>
      <nav className="side-nav">
        <div className="nav-wrap has-tooltip" data-tooltip={t(lang, 'tipLang')}>
          <select
            className="nav-control nav-lang"
            value={lang}
            onChange={(e) => settings.setLang(e.target.value as Lang)}
          >
            <option value="vi">🇻🇳 Tiếng Việt</option>
            <option value="en">🇬🇧 English</option>
          </select>
        </div>

        <div className="nav-wrap has-tooltip" data-tooltip={t(lang, 'tipGameMode')}>
          <select
            className="nav-control"
            value={gameMode}
            onChange={(e) => onModeChange(e.target.value as GameMode)}
          >
            <option value="classic">{t(lang, 'modeClassic')}</option>
            <option value="lesson">{t(lang, 'modeLesson')}</option>
            <option value="timeAttack">{t(lang, 'modeTimeAttack')}</option>
            <option value="challenge">{t(lang, 'modeChallenge')}</option>
          </select>
        </div>

        {gameMode === 'lesson' && (
          <div className="nav-wrap nav-sub has-tooltip" data-tooltip={t(lang, 'tipLesson')}>
            <select
              className="nav-control"
              value={lessonIndex}
              onChange={(e) => onLessonChange(parseInt(e.target.value))}
            >
              {LESSONS.map((lesson, i) => (
                <option key={i} value={i}>
                  {i === 4 ? t(lang, 'lessonAll') : `${['🏠', '⬆️', '⬇️', '🔀', '🌈'][i]} ${lesson.name}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {gameMode === 'timeAttack' && (
          <div className="nav-wrap nav-sub has-tooltip" data-tooltip={t(lang, 'tipTimeAttack')}>
            <select
              className="nav-control"
              value={timeAttackDuration}
              onChange={(e) => onTimeAttackChange(parseInt(e.target.value))}
            >
              <option value="30">🐇 30s</option>
              <option value="60">🦊 60s</option>
              <option value="120">🐢 120s</option>
            </select>
          </div>
        )}

        <div className="nav-wrap has-tooltip" data-tooltip={t(lang, 'tipLevel')}>
          <select
            className="nav-control"
            value={settings.level}
            onChange={(e) => onLevelChange(e.target.value as Level)}
          >
            <option value="easy">{t(lang, 'lvEasy')}</option>
            <option value="medium">{t(lang, 'lvMedium')}</option>
            <option value="hard">{t(lang, 'lvHard')}</option>
          </select>
        </div>

        {wordPacks.length > 0 && (
          <div className="nav-wrap has-tooltip" data-tooltip={lang === 'vi' ? 'Chọn bộ từ' : 'Choose word pack'}>
            <select
              className="nav-control"
              value={selectedWordPackId ?? 'default'}
              onChange={(e) => handleWordPackSelect(e.target.value)}
            >
              <option value="default">{lang === 'vi' ? '📦 Mặc định' : '📦 Default'}</option>
              {wordPacks.map((pack) => (
                <option key={pack.id} value={pack.id}>
                  📦 {pack.name} ({pack.wordCount})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="nav-wrap has-tooltip" data-tooltip={t(lang, 'tipSoundMode')}>
          <select
            className="nav-control"
            value={settings.soundMode}
            onChange={(e) => settings.setSoundMode(e.target.value as SoundMode)}
          >
            <option value="default">{t(lang, 'smDefault')}</option>
            <option value="character">{t(lang, 'smChar')}</option>
            <option value="word">{t(lang, 'smWord')}</option>
          </select>
        </div>

        <button className="nav-btn has-tooltip" data-tooltip={t(lang, 'tipSettings')} onClick={onOpenSettings}>
          {t(lang, 'btnSettings')}
        </button>
        <button className="nav-btn has-tooltip" data-tooltip={t(lang, 'tipHistory')} onClick={onOpenHistory}>
          {t(lang, 'btnHistory')}
        </button>

        <Link href="/leaderboard" className="nav-btn has-tooltip" data-tooltip={t(lang, 'navLeaderboard')}>
          {t(lang, 'navLeaderboard')}
        </Link>
        <Link href="/friends" className="nav-btn has-tooltip" data-tooltip={t(lang, 'navFriends')}>
          {t(lang, 'navFriends')}
        </Link>
      </nav>

      <aside className="quick-actions">
        <button className="qa-btn has-tooltip" data-tooltip={t(lang, 'tipRestart')} onClick={onRestart}>🔃</button>
        <button
          className="qa-btn has-tooltip"
          data-tooltip={t(lang, 'tipSound')}
          onClick={() => settings.setSoundEnabled(!settings.soundEnabled)}
        >
          {settings.soundEnabled ? '🔊' : '🔇'}
        </button>
      </aside>
    </>
  )
}
