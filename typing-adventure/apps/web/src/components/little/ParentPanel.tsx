'use client'

import { useEffect, useState } from 'react'
import { LETTER_ORDER, MASTERY_FIRST_TRY, sessionsLeftToday } from '@typing-adventure/game-engine'
import type { AgeGroup } from '@typing-adventure/game-engine'
import { t } from '@typing-adventure/i18n'
import { useSettingsStore } from '@/stores/settings-store'
import { useLittleStore } from '@/stores/little-store'
import { localToday } from '@/lib/little/today'
import type { LittleVoice } from '@/hooks/useLittleVoice'

interface ParentPanelProps {
  voice: LittleVoice
  onClose: () => void
}

export function ParentPanel({ voice, onClose }: ParentPanelProps) {
  const settings = useSettingsStore()
  const lang = settings.lang
  const little = useLittleStore()
  const today = localToday()
  const [hasVi, setHasVi] = useState(true)

  useEffect(() => {
    setHasVi(voice.hasViVoice())
    const timer = setTimeout(() => setHasVi(voice.hasViVoice()), 1000)
    return () => clearTimeout(timer)
  }, [voice])

  const usedToday = little.daily.date === today ? little.daily.sessions : 0
  const allowedToday = little.dailyLimit + (little.daily.date === today ? little.daily.bonus : 0)
  const left = sessionsLeftToday(little.daily, today, little.dailyLimit)

  return (
    <div className="little-screen little-parent">
      <div className="parent-card">
        <header className="parent-head">
          <h1>👪 {t(lang, 'parentTitle')}</h1>
          <button type="button" className="parent-btn" onClick={onClose}>✕ {t(lang, 'parentClose')}</button>
        </header>

        <section className="parent-section">
          <h2>{t(lang, 'parentLetters')}</h2>
          <p className="parent-dim">{t(lang, 'parentLegend')}</p>
          <div className="parent-letters">
            {LETTER_ORDER.map(l => {
              const p = little.progress[l]
              const cls = (p?.firstTry ?? 0) >= MASTERY_FIRST_TRY ? 'ok' : (p?.seen ?? 0) > 0 ? 'seen' : ''
              return <span key={l} className={`parent-letter ${cls}`}>{l.toUpperCase()}</span>
            })}
          </div>
        </section>

        <section className="parent-section">
          <div className="parent-row">
            <span>{t(lang, 'parentToday')}</span>
            <b>{usedToday} / {allowedToday} {t(lang, 'parentSessionsUnit')}</b>
          </div>
          <div className="parent-row">
            <span>{t(lang, 'parentTotal')}</span>
            <b>{little.stickers.length}</b>
          </div>
          <div className="parent-row">
            <span>{t(lang, 'parentLimit')}</span>
            <span className="parent-stepper">
              <button type="button" className="parent-btn" onClick={() => little.setDailyLimit(little.dailyLimit - 1)}>−</button>
              <b>{little.dailyLimit}</b>
              <button type="button" className="parent-btn" onClick={() => little.setDailyLimit(little.dailyLimit + 1)}>+</button>
            </span>
          </div>
          <div className="parent-row">
            <span>{t(lang, 'parentBonus')}</span>
            <button type="button" className="parent-btn" disabled={left > 0} onClick={() => little.grantBonus(today)}>
              {t(lang, 'parentBonusBtn')}
            </button>
          </div>
        </section>

        <section className="parent-section">
          <div className="parent-row">
            <span>{t(lang, 'parentAge')}</span>
            <select
              className="parent-select"
              value={settings.ageGroup ?? 'little'}
              onChange={(e) => settings.setAgeGroup(e.target.value as AgeGroup)}
            >
              <option value="little">🐣 {t(lang, 'ageLittle')}</option>
              <option value="kid">🐥 {t(lang, 'ageKid')}</option>
              <option value="big">🦅 {t(lang, 'ageBig')}</option>
            </select>
          </div>
          <div className="parent-row">
            <span>🌐</span>
            <select className="parent-select" value={lang} onChange={(e) => settings.setLang(e.target.value as 'vi' | 'en')}>
              <option value="vi">🇻🇳 Tiếng Việt</option>
              <option value="en">🇬🇧 English</option>
            </select>
          </div>
          <div className="parent-row">
            <span>{t(lang, 'parentSound')}</span>
            <span className="parent-stepper">
              <button type="button" className="parent-btn" onClick={() => settings.setSoundEnabled(!settings.soundEnabled)}>
                {settings.soundEnabled ? '🔊' : '🔇'}
              </button>
              <button type="button" className="parent-btn" onClick={() => { voice.unlockAudio(); voice.testVoice() }}>
                ▶ {t(lang, 'parentVoiceTest')}
              </button>
            </span>
          </div>
          {lang === 'vi' && !hasVi && <p className="parent-warn">{t(lang, 'parentNoViVoice')}</p>}
        </section>

        <section className="parent-section">
          <button
            type="button"
            className="parent-btn parent-btn--danger"
            onClick={() => {
              if (window.confirm(t(lang, 'parentResetConfirm'))) little.resetProgress()
            }}
          >
            🗑️ {t(lang, 'parentReset')}
          </button>
        </section>
      </div>
    </div>
  )
}
