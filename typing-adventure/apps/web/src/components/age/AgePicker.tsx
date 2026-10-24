'use client'

import { useSettingsStore } from '@/stores/settings-store'
import { t } from '@typing-adventure/i18n'
import type { TranslationKey } from '@typing-adventure/i18n'
import type { AgeGroup } from '@typing-adventure/game-engine'

const OPTIONS: { value: AgeGroup; emoji: string; label: TranslationKey; desc: TranslationKey }[] = [
  { value: 'little', emoji: '🐣', label: 'ageLittle', desc: 'ageLittleDesc' },
  { value: 'kid', emoji: '🐥', label: 'ageKid', desc: 'ageKidDesc' },
  { value: 'big', emoji: '🦅', label: 'ageBig', desc: 'ageBigDesc' },
]

export function AgePicker() {
  const lang = useSettingsStore(s => s.lang)
  const setLang = useSettingsStore(s => s.setLang)
  const setAgeGroup = useSettingsStore(s => s.setAgeGroup)

  return (
    <div className="little-root">
      <div className="little-screen age-picker">
        <button
          className="little-chip age-lang"
          onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
        >
          {lang === 'vi' ? '🇬🇧 English' : '🇻🇳 Tiếng Việt'}
        </button>
        <div className="little-mascot little-mascot--wave" aria-hidden>🦉</div>
        <div className="little-bubble">{t(lang, 'agePickTitle')}</div>
        <p className="age-hint">{t(lang, 'agePickHint')}</p>
        <div className="age-options">
          {OPTIONS.map(o => (
            <button key={o.value} className="age-card" onClick={() => setAgeGroup(o.value)}>
              <span className="age-card-emoji" aria-hidden>{o.emoji}</span>
              <b>{t(lang, o.label)}</b>
              <span>{t(lang, o.desc)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
