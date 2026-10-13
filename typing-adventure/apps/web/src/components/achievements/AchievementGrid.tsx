'use client'

import { ACHIEVEMENTS } from '@typing-adventure/game-engine'
import { useSettingsStore } from '@/stores/settings-store'
import { useRecordsStore } from '@/stores/records-store'
import { t } from '@typing-adventure/i18n'
import type { TranslationKey } from '@typing-adventure/i18n'

interface AchievementGridProps {
  onClose: () => void
}

export function AchievementGrid({ onClose }: AchievementGridProps) {
  const lang = useSettingsStore(s => s.lang)
  const unlocked = useRecordsStore(s => s.unlockedAchievements)

  return (
    <div className="settings-overlay settings--visible" onClick={(e) => {
      if (e.target === e.currentTarget) onClose()
    }}>
      <div className="settings-panel">
        <div className="settings-header">
          <h2 className="settings-title">{t(lang, 'achTitle')}</h2>
          <button className="settings-close" onClick={onClose}>✕</button>
        </div>

        <div className="settings-body">
          <div className="achievements-grid">
            {ACHIEVEMENTS.map((ach) => {
              const isUnlocked = unlocked.includes(ach.id)
              return (
                <div
                  key={ach.id}
                  className={`ach-card ${isUnlocked ? 'ach--unlocked' : 'ach--locked'}`}
                >
                  <div className="ach-card-icon">{isUnlocked ? ach.icon : '🔒'}</div>
                  <div className="ach-card-name">{t(lang, ach.nameKey as TranslationKey)}</div>
                  <div className="ach-card-desc">{t(lang, ach.descKey as TranslationKey)}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
