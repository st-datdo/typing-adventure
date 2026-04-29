'use client'

import { useSettingsStore } from '@/stores/settings-store'
import { t } from '@typing-adventure/i18n'
import type { Theme, KeyboardCase, SpeechRate } from '@typing-adventure/game-engine'

interface SettingsPanelProps {
  onClose: () => void
  onOpenAchievements: () => void
}

export function SettingsPanel({ onClose, onOpenAchievements }: SettingsPanelProps) {
  const settings = useSettingsStore()
  const lang = settings.lang

  return (
    <div className="settings-overlay settings--visible" onClick={(e) => {
      if (e.target === e.currentTarget) onClose()
    }}>
      <div className="settings-panel">
        <div className="settings-header">
          <h2 className="settings-title">{t(lang, 'settingsTitle')}</h2>
          <button className="settings-close" onClick={onClose}>✕</button>
        </div>

        <div className="settings-body">
          {/* Profile */}
          <div className="setting-group">
            <div className="setting-label">{t(lang, 'profileLabel')}</div>
            <div className="setting-desc">{t(lang, 'profileDesc')}</div>
            <div className="profile-row">
              <select
                className="setting-control profile-avatar-select"
                value={settings.playerAvatar}
                onChange={(e) => settings.setPlayerAvatar(e.target.value)}
              >
                {['🧒', '👦', '👧', '🧒🏻', '👦🏻', '👧🏻', '🦸', '🧙', '🧚', '🤖', '👽', '🐱', '🐶', '🦊', '🐼', '🐸'].map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              <input
                type="text"
                className="setting-control profile-name-input"
                value={settings.playerName}
                onChange={(e) => settings.setPlayerName(e.target.value)}
                placeholder={t(lang, 'profilePlaceholder')}
                maxLength={50}
              />
            </div>
          </div>

          {/* Achievements */}
          <div className="setting-group">
            <div className="setting-label">{t(lang, 'achLabel')}</div>
            <div className="setting-desc">{t(lang, 'achDesc')}</div>
            <button className="btn btn-achievements" onClick={onOpenAchievements}>
              {t(lang, 'achBtn')}
            </button>
          </div>

          {/* Theme */}
          <div className="setting-group">
            <div className="setting-label">{t(lang, 'themeLabel')}</div>
            <div className="setting-desc">{t(lang, 'themeDesc')}</div>
            <select
              className="setting-control"
              value={settings.theme}
              onChange={(e) => settings.setTheme(e.target.value as Theme)}
            >
              <option value="dark">{t(lang, 'themeDark')}</option>
              <option value="light">{t(lang, 'themeLight')}</option>
              <option value="colorful">{t(lang, 'themeColorful')}</option>
            </select>
          </div>

          {/* Keyboard case */}
          <div className="setting-group">
            <div className="setting-label">{t(lang, 'caseLabel')}</div>
            <div className="setting-desc">{t(lang, 'caseDesc')}</div>
            <select
              className="setting-control"
              value={settings.keyboardCase}
              onChange={(e) => settings.setKeyboardCase(e.target.value as KeyboardCase)}
            >
              <option value="lower">{t(lang, 'caseLower')}</option>
              <option value="upper">{t(lang, 'caseUpper')}</option>
            </select>
          </div>

          {/* Speech rate */}
          <div className="setting-group">
            <div className="setting-label">{t(lang, 'speechLabel')}</div>
            <div className="setting-desc">{t(lang, 'speechDesc')}</div>
            <select
              className="setting-control"
              value={settings.speechRate}
              onChange={(e) => settings.setSpeechRate(e.target.value as SpeechRate)}
            >
              <option value="slow">{t(lang, 'speechSlow')}</option>
              <option value="normal">{t(lang, 'speechNormal')}</option>
              <option value="fast">{t(lang, 'speechFast')}</option>
            </select>
          </div>

          {/* Word count */}
          <div className="setting-group">
            <div className="setting-label">{t(lang, 'wcLabel')}</div>
            <div className="setting-desc">{t(lang, 'wcDesc')}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <input
                type="range"
                min={3}
                max={30}
                value={settings.wordCount}
                onChange={(e) => settings.setWordCount(parseInt(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: '0.9rem', fontWeight: 700, minWidth: 50, textAlign: 'center' }}>
                {settings.wordCount} {t(lang, 'wcUnit')}
              </span>
            </div>
          </div>

          {/* Finger guide */}
          <div className="setting-group">
            <div className="setting-label">{t(lang, 'fgLabel')}</div>
            <div className="setting-desc">{t(lang, 'fgDesc')}</div>
            <label className="setting-toggle">
              <input
                type="checkbox"
                checked={settings.fingerGuide}
                onChange={(e) => settings.setFingerGuide(e.target.checked)}
              />
              <span className="toggle-track">
                <span className="toggle-thumb" />
              </span>
              <span className="toggle-label">
                {settings.fingerGuide ? t(lang, 'toggleOn') : t(lang, 'toggleOff')}
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
