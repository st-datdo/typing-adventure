'use client'

import { useSettingsStore } from '@/stores/settings-store'
import { t } from '@typing-adventure/i18n'
import type { Theme, KeyboardCase, SpeechRate, AgeGroup } from '@typing-adventure/game-engine'

interface SettingsPanelProps {
  onClose: () => void
  onOpenAchievements: () => void
}

export function SettingsPanel({ onClose, onOpenAchievements }: SettingsPanelProps) {
  const settings = useSettingsStore()
  const lang = settings.lang

  return (
    <div className="ui-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) onClose()
    }}>
      <div className="ui-modal ta-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div className="ta-modal-head">
          <h2 id="settings-title" className="ta-modal-title">{t(lang, 'settingsTitle')}</h2>
          <button type="button" className="ui-chip" aria-label={t(lang, 'navClose')} title={t(lang, 'navClose')} onClick={onClose}>✕</button>
        </div>

        <div className="ta-modal-body">
          <div className="ta-field">
            <label className="ui-label" htmlFor="set-name">{t(lang, 'profileLabel')}</label>
            <div className="ta-hint">{t(lang, 'profileDesc')}</div>
            <div className="ta-profile-row">
              <select
                aria-label={t(lang, 'profileLabel')}
                className="ui-select ta-avatar-select"
                value={settings.playerAvatar}
                onChange={(e) => settings.setPlayerAvatar(e.target.value)}
              >
                {['🧒', '👦', '👧', '🧒🏻', '👦🏻', '👧🏻', '🦸', '🧙', '🧚', '🤖', '👽', '🐱', '🐶', '🦊', '🐼', '🐸'].map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              <input
                id="set-name"
                type="text"
                className="ui-input"
                value={settings.playerName}
                onChange={(e) => settings.setPlayerName(e.target.value)}
                placeholder={t(lang, 'profilePlaceholder')}
                maxLength={50}
              />
            </div>
          </div>

          <div className="ta-field">
            <div className="ui-label">{t(lang, 'achLabel')}</div>
            <div className="ta-hint">{t(lang, 'achDesc')}</div>
            <button type="button" className="ui-btn ui-btn--sun ui-btn--block" onClick={onOpenAchievements}>
              {t(lang, 'achBtn')}
            </button>
          </div>

          <div className="ta-field">
            <label className="ui-label" htmlFor="set-age">{t(lang, 'ageLabel')}</label>
            <div className="ta-hint">{t(lang, 'ageDesc')}</div>
            <select
              id="set-age"
              className="ui-select"
              value={settings.ageGroup ?? 'big'}
              onChange={(e) => settings.setAgeGroup(e.target.value as AgeGroup)}
            >
              <option value="little">🐣 {t(lang, 'ageLittle')}</option>
              <option value="kid">🐥 {t(lang, 'ageKid')}</option>
              <option value="big">🦅 {t(lang, 'ageBig')}</option>
            </select>
          </div>

          <div className="ta-field">
            <label className="ui-label" htmlFor="set-theme">{t(lang, 'themeLabel')}</label>
            <div className="ta-hint">{t(lang, 'themeDesc')}</div>
            <select
              id="set-theme"
              className="ui-select"
              value={settings.theme}
              onChange={(e) => settings.setTheme(e.target.value as Theme)}
            >
              <option value="light">{t(lang, 'themeLight')}</option>
              <option value="dark">{t(lang, 'themeDark')}</option>
              <option value="colorful">{t(lang, 'themeColorful')}</option>
            </select>
          </div>

          <div className="ta-field">
            <label className="ui-label" htmlFor="set-case">{t(lang, 'caseLabel')}</label>
            <div className="ta-hint">{t(lang, 'caseDesc')}</div>
            <select
              id="set-case"
              className="ui-select"
              value={settings.keyboardCase}
              onChange={(e) => settings.setKeyboardCase(e.target.value as KeyboardCase)}
            >
              <option value="lower">{t(lang, 'caseLower')}</option>
              <option value="upper">{t(lang, 'caseUpper')}</option>
            </select>
          </div>

          <div className="ta-field">
            <label className="ui-label" htmlFor="set-speech">{t(lang, 'speechLabel')}</label>
            <div className="ta-hint">{t(lang, 'speechDesc')}</div>
            <select
              id="set-speech"
              className="ui-select"
              value={settings.speechRate}
              onChange={(e) => settings.setSpeechRate(e.target.value as SpeechRate)}
            >
              <option value="slow">{t(lang, 'speechSlow')}</option>
              <option value="normal">{t(lang, 'speechNormal')}</option>
              <option value="fast">{t(lang, 'speechFast')}</option>
            </select>
          </div>

          <div className="ta-field">
            <label className="ui-label" htmlFor="set-wc">{t(lang, 'wcLabel')}</label>
            <div className="ta-hint">{t(lang, 'wcDesc')}</div>
            <div className="ta-range-row">
              <input
                id="set-wc"
                type="range"
                className="ta-range"
                min={3}
                max={30}
                value={settings.wordCount}
                onChange={(e) => settings.setWordCount(parseInt(e.target.value))}
              />
              <span className="ta-range-value">
                {settings.wordCount} {t(lang, 'wcUnit')}
              </span>
            </div>
          </div>

          <div className="ta-field">
            <div className="ui-label">{t(lang, 'fgLabel')}</div>
            <div className="ta-hint">{t(lang, 'fgDesc')}</div>
            <label className="ta-toggle">
              <input
                type="checkbox"
                checked={settings.fingerGuide}
                onChange={(e) => settings.setFingerGuide(e.target.checked)}
              />
              <span className="ta-toggle-track">
                <span className="ta-toggle-thumb" />
              </span>
              <span className="ta-toggle-label">
                {settings.fingerGuide ? t(lang, 'toggleOn') : t(lang, 'toggleOff')}
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
