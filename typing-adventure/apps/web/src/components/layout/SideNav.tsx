'use client'

import { useEffect, useState } from 'react'
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
  open: boolean
  onClose: () => void
  gameMode: GameMode
  lessonIndex: number
  timeAttackDuration: number
  selectedWordPackId: string | null
  onModeChange: (mode: GameMode) => void
  onLevelChange: (level: Level) => void
  onLessonChange: (index: number) => void
  onTimeAttackChange: (duration: number) => void
  onWordPackChange: (packId: string | null, words: string[] | undefined) => void
  onOpenSettings: () => void
  onOpenHistory: () => void
}

export function SideNav({
  open,
  onClose,
  gameMode,
  lessonIndex,
  timeAttackDuration,
  selectedWordPackId,
  onModeChange,
  onLevelChange,
  onLessonChange,
  onTimeAttackChange,
  onWordPackChange,
  onOpenSettings,
  onOpenHistory,
}: SideNavProps) {
  const settings = useSettingsStore()
  const lang = settings.lang
  const showSocial = settings.ageGroup === null || AGE_PROFILES[settings.ageGroup].social
  const [wordPacks, setWordPacks] = useState<WordPackSummary[]>([])

  useEffect(() => {
    getWordPacks().then((res) => {
      if (res.success && res.data) setWordPacks(res.data)
    })
  }, [])

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  const handleWordPackSelect = (packId: string) => {
    if (packId === 'default') {
      onWordPackChange(null, undefined)
    } else {
      const pack = wordPacks.find((p) => p.id === packId)
      onWordPackChange(packId, pack?.words)
    }
  }

  return (
    <>
      {open && <div className="sidenav-backdrop" onClick={onClose} />}

      <nav
        id="side-nav"
        className={`side-nav ${open ? 'side-nav--open' : ''}`}
        aria-hidden={!open}
        inert={!open}
      >
        <div className="side-nav-head">
          <span className="side-nav-title">🦉 {t(lang, 'navMenu')}</span>
          <button type="button" className="ui-chip" aria-label={t(lang, 'navClose')} title={t(lang, 'navClose')} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="side-nav-field">
          <label className="ui-label" htmlFor="nav-lang">{t(lang, 'langLabel')}</label>
          <select
            id="nav-lang"
            className="ui-select"
            value={lang}
            onChange={(e) => settings.setLang(e.target.value as Lang)}
          >
            <option value="vi">🇻🇳 Tiếng Việt</option>
            <option value="en">🇬🇧 English</option>
          </select>
        </div>

        <div className="side-nav-field">
          <label className="ui-label" htmlFor="nav-mode">{t(lang, 'lblGameMode')}</label>
          <select
            id="nav-mode"
            className="ui-select"
            value={gameMode}
            onChange={(e) => onModeChange(e.target.value as GameMode)}
          >
            {MODE_OPTIONS.filter(m => isModeAllowed(settings.ageGroup, m.value)).map(m => (
              <option key={m.value} value={m.value}>{t(lang, m.label)}</option>
            ))}
          </select>
        </div>

        {gameMode === 'lesson' && (
          <div className="side-nav-field">
            <label className="ui-label" htmlFor="nav-lesson">{t(lang, 'lblLessonPick')}</label>
            <select
              id="nav-lesson"
              className="ui-select"
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
          <div className="side-nav-field">
            <label className="ui-label" htmlFor="nav-duration">{t(lang, 'lblDuration')}</label>
            <select
              id="nav-duration"
              className="ui-select"
              value={timeAttackDuration}
              onChange={(e) => onTimeAttackChange(parseInt(e.target.value))}
            >
              <option value="30">🐇 30s</option>
              <option value="60">🦊 60s</option>
              <option value="120">🐢 120s</option>
            </select>
          </div>
        )}

        <div className="side-nav-field">
          <label className="ui-label" htmlFor="nav-level">{t(lang, 'lblLevelPick')}</label>
          <select
            id="nav-level"
            className="ui-select"
            value={settings.level}
            onChange={(e) => onLevelChange(e.target.value as Level)}
          >
            <option value="easy">{t(lang, 'lvEasy')}</option>
            <option value="medium">{t(lang, 'lvMedium')}</option>
            <option value="hard">{t(lang, 'lvHard')}</option>
          </select>
        </div>

        {wordPacks.length > 0 && (
          <div className="side-nav-field">
            <label className="ui-label" htmlFor="nav-pack">{t(lang, 'lblWordPack')}</label>
            <select
              id="nav-pack"
              className="ui-select"
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

        <div className="side-nav-field">
          <label className="ui-label" htmlFor="nav-sound">{t(lang, 'lblSoundMode')}</label>
          <select
            id="nav-sound"
            className="ui-select"
            value={settings.soundMode}
            onChange={(e) => settings.setSoundMode(e.target.value as SoundMode)}
          >
            <option value="default">{t(lang, 'smDefault')}</option>
            <option value="character">{t(lang, 'smChar')}</option>
            <option value="word">{t(lang, 'smWord')}</option>
          </select>
        </div>

        <div className="side-nav-actions">
          <button type="button" className="ui-btn ui-btn--sm ui-btn--block" title={t(lang, 'tipSettings')} onClick={() => { onOpenSettings(); onClose() }}>
            {t(lang, 'btnSettings')}
          </button>
          <button type="button" className="ui-btn ui-btn--sm ui-btn--block" title={t(lang, 'tipHistory')} onClick={() => { onOpenHistory(); onClose() }}>
            {t(lang, 'btnHistory')}
          </button>
        </div>

        <div className="side-nav-section">{t(lang, 'navMore')}</div>
        <div className="side-nav-actions">
          <Link href="/games" className="ui-btn ui-btn--sm ui-btn--block ui-btn--sun" onClick={onClose}>
            {t(lang, 'navGames')}
          </Link>
          {showSocial && (
            <>
              <Link href="/leaderboard" className="ui-btn ui-btn--sm ui-btn--block" onClick={onClose}>
                {t(lang, 'navLeaderboard')}
              </Link>
              <Link href="/friends" className="ui-btn ui-btn--sm ui-btn--block" onClick={onClose}>
                {t(lang, 'navFriends')}
              </Link>
              <Link href="/lobby" className="ui-btn ui-btn--sm ui-btn--block" onClick={onClose}>
                {t(lang, 'navMultiplayer')}
              </Link>
            </>
          )}
        </div>
      </nav>
    </>
  )
}
