'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSettingsStore } from '@/stores/settings-store'
import { t } from '@typing-adventure/i18n'
import type { TranslationKey } from '@typing-adventure/i18n'
import { LESSONS, AGE_PROFILES, isModeAllowed } from '@typing-adventure/game-engine'
import type { GameMode, Level, SoundMode, Lang } from '@typing-adventure/game-engine'
import { getWordPacks, type WordPackSummary } from '@/lib/api/wordpacks'
import { ChoiceCards } from '@/components/ui/ChoiceCards'
import type { IconName } from '@/components/ui/icons/icons'
import { Icon } from '@/components/ui/icons/Icon'
import { OwlMascot } from '@/components/mascot/OwlMascot'
import { plainLabel } from '@/lib/kr/plain-label'

const MODE_OPTIONS: { value: GameMode; label: TranslationKey; icon: IconName }[] = [
  { value: 'classic', label: 'modeClassic', icon: 'keyCap' },
  { value: 'lesson', label: 'modeLesson', icon: 'book' },
  { value: 'timeAttack', label: 'modeTimeAttack', icon: 'stopwatch' },
  { value: 'challenge', label: 'modeChallenge', icon: 'shield' },
]

const LESSON_ICONS: IconName[] = ['home', 'arrowUp', 'arrowDown', 'arrowsUpDown', 'rainbow']

const LEVEL_OPTIONS: { value: Level; label: TranslationKey; icon: IconName }[] = [
  { value: 'easy', label: 'lvEasy', icon: 'hillSmall' },
  { value: 'medium', label: 'lvMedium', icon: 'hillDouble' },
  { value: 'hard', label: 'lvHard', icon: 'mountainFlag' },
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
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) closeRef.current?.focus()
  }, [open])

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
          <span className="side-nav-title">
            <OwlMascot size="sm" still /> {t(lang, 'navMenu')}
          </span>
          <button
            ref={closeRef}
            type="button"
            className="ui-chip"
            aria-label={t(lang, 'navClose')}
            title={t(lang, 'navClose')}
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="side-nav-field">
          <label className="ui-label" htmlFor="nav-lang">
            {t(lang, 'langLabel')}
          </label>
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
          <span className="ui-label" id="nav-mode-label">
            {t(lang, 'lblGameMode')}
          </span>
          <ChoiceCards
            labelId="nav-mode-label"
            value={gameMode}
            onChange={(m) => {
              if (m !== gameMode) onModeChange(m)
            }}
            options={MODE_OPTIONS.filter((m) => isModeAllowed(settings.ageGroup, m.value)).map(
              (m) => ({
                value: m.value,
                label: plainLabel(t(lang, m.label)),
                icon: m.icon,
              }),
            )}
          />
        </div>

        {gameMode === 'lesson' && (
          <div className="side-nav-field">
            <span className="ui-label" id="nav-lesson-label">
              {t(lang, 'lblLessonPick')}
            </span>
            <ChoiceCards
              labelId="nav-lesson-label"
              columns={1}
              value={lessonIndex}
              onChange={(i) => {
                if (i !== lessonIndex) onLessonChange(i)
              }}
              options={LESSONS.map((lesson, i) => ({
                value: i,
                label: i === 4 ? plainLabel(t(lang, 'lessonAll')) : lesson.name,
                icon: LESSON_ICONS[i] ?? 'book',
              }))}
            />
          </div>
        )}

        {gameMode === 'timeAttack' && (
          <div className="side-nav-field">
            <label className="ui-label" htmlFor="nav-duration">
              {t(lang, 'lblDuration')}
            </label>
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
          <span className="ui-label" id="nav-level-label">
            {t(lang, 'lblLevelPick')}
          </span>
          <ChoiceCards
            labelId="nav-level-label"
            value={settings.level}
            onChange={(lv) => {
              if (lv !== settings.level) onLevelChange(lv)
            }}
            options={LEVEL_OPTIONS.map((lv) => ({
              value: lv.value,
              label: plainLabel(t(lang, lv.label)),
              icon: lv.icon,
            }))}
          />
        </div>

        {wordPacks.length > 0 && (
          <div className="side-nav-field">
            <label className="ui-label" htmlFor="nav-pack">
              {t(lang, 'lblWordPack')}
            </label>
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
          <label className="ui-label" htmlFor="nav-sound">
            {t(lang, 'lblSoundMode')}
          </label>
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
          <button
            type="button"
            className="ui-btn ui-btn--sm ui-btn--block"
            title={t(lang, 'tipSettings')}
            onClick={() => {
              onOpenSettings()
              onClose()
            }}
          >
            {t(lang, 'btnSettings')}
          </button>
          <button
            type="button"
            className="ui-btn ui-btn--sm ui-btn--block"
            title={t(lang, 'tipHistory')}
            onClick={() => {
              onOpenHistory()
              onClose()
            }}
          >
            {t(lang, 'btnHistory')}
          </button>
        </div>

        <div className="side-nav-section">{t(lang, 'navMore')}</div>
        <div className="side-nav-actions">
          <Link
            href="/games"
            className="ui-btn ui-btn--sm ui-btn--block ui-btn--sun"
            onClick={onClose}
          >
            {t(lang, 'navGames')}
          </Link>
          {showSocial && (
            <>
              <Link
                href="/leaderboard"
                className="ui-btn ui-btn--sm ui-btn--block"
                onClick={onClose}
              >
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
