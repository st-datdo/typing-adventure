'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSettingsStore } from '@/stores/settings-store'
import { t } from '@typing-adventure/i18n'
import type { TranslationKey } from '@typing-adventure/i18n'
import { LESSONS, AGE_PROFILES, isModeAllowed } from '@typing-adventure/game-engine'
import type { GameMode, Level, SoundMode, Lang } from '@typing-adventure/game-engine'
import { getWordPacks, type WordPackSummary } from '@/lib/api/wordpacks'

const MODE_OPTIONS: { value: GameMode; label: TranslationKey }[] = [
  { value: 'classic', label: 'modeClassic' },
  { value: 'lesson', label: 'modeLesson' },
  { value: 'timeAttack', label: 'modeTimeAttack' },
  { value: 'challenge', label: 'modeChallenge' },
]

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
  const showSocial = settings.ageGroup === null || AGE_PROFILES[settings.ageGroup].social
  const [wordPacks, setWordPacks] = useState<WordPackSummary[]>([])
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    getWordPacks().then((res) => {
      if (res.success && res.data) setWordPacks(res.data)
    })
  }, [])

  // Close mobile nav on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setMobileOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const closeMobile = useCallback(() => setMobileOpen(false), [])

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
      {/* Mobile hamburger toggle */}
      <button
        className="sidenav-toggle"
        onClick={() => setMobileOpen((o) => !o)}
        aria-label="Toggle menu"
      >
        <span className={`sidenav-toggle-icon ${mobileOpen ? 'sidenav-toggle-icon--open' : ''}`} />
      </button>

      {/* Backdrop for mobile overlay */}
      {mobileOpen && (
        <div className="sidenav-backdrop" onClick={closeMobile} />
      )}

      <nav className={`side-nav ${mobileOpen ? 'side-nav--open' : ''}`}>
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
            {MODE_OPTIONS.filter(m => isModeAllowed(settings.ageGroup, m.value)).map(m => (
              <option key={m.value} value={m.value}>{t(lang, m.label)}</option>
            ))}
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

        <button className="nav-btn has-tooltip" data-tooltip={t(lang, 'tipSettings')} onClick={() => { onOpenSettings(); closeMobile() }}>
          {t(lang, 'btnSettings')}
        </button>
        <button className="nav-btn has-tooltip" data-tooltip={t(lang, 'tipHistory')} onClick={() => { onOpenHistory(); closeMobile() }}>
          {t(lang, 'btnHistory')}
        </button>

        <Link href="/games" className="nav-btn nav-btn--games has-tooltip" data-tooltip={t(lang, 'gamesTitle')} onClick={closeMobile}>
          {t(lang, 'navGames')}
        </Link>

        {showSocial && (
          <>
            <Link href="/leaderboard" className="nav-btn has-tooltip" data-tooltip={t(lang, 'navLeaderboard')} onClick={closeMobile}>
              {t(lang, 'navLeaderboard')}
            </Link>
            <Link href="/friends" className="nav-btn has-tooltip" data-tooltip={t(lang, 'navFriends')} onClick={closeMobile}>
              {t(lang, 'navFriends')}
            </Link>
            <Link href="/lobby" className="nav-btn has-tooltip" data-tooltip={t(lang, 'navMultiplayer')} onClick={closeMobile}>
              {t(lang, 'navMultiplayer')}
            </Link>
          </>
        )}
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
