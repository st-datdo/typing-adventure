'use client'

import type { CSSProperties } from 'react'
import { useSettingsStore } from '@/stores/settings-store'
import { t } from '@typing-adventure/i18n'
import type { TranslationKey } from '@typing-adventure/i18n'
import type { AgeGroup } from '@typing-adventure/game-engine'
import { OwlMascot } from '../mascot/OwlMascot'
import { Icon } from '../ui/icons/Icon'
import { SceneBackdrop } from '../decor/SceneBackdrop'

const OPTIONS: { value: AgeGroup; label: TranslationKey; desc: TranslationKey }[] = [
  { value: 'little', label: 'ageLittle', desc: 'ageLittleDesc' },
  { value: 'kid', label: 'ageKid', desc: 'ageKidDesc' },
  { value: 'big', label: 'ageBig', desc: 'ageBigDesc' },
]

const enter = (i: number) => ({ '--i': i }) as CSSProperties

export function AgePicker() {
  const lang = useSettingsStore((s) => s.lang)
  const setLang = useSettingsStore((s) => s.setLang)
  const setAgeGroup = useSettingsStore((s) => s.setAgeGroup)

  return (
    <div className="little-root">
      <SceneBackdrop variant="picker" />
      <div className="little-screen age-picker">
        <button
          className="little-chip age-lang kr-enter"
          style={enter(0)}
          onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
        >
          <Icon name="globe" size={20} />
          {lang === 'vi' ? 'English' : 'Tiếng Việt'}
        </button>
        <div className="little-mascot kr-enter" style={enter(1)} aria-hidden>
          <OwlMascot mood="wave" size="lg" />
        </div>
        <div className="little-bubble kr-enter" style={enter(2)} role="status">
          {t(lang, 'agePickTitle')}
        </div>
        <p className="age-hint kr-enter" style={enter(3)}>
          {t(lang, 'agePickHint')}
        </p>
        <div className="age-options">
          {OPTIONS.map((o, i) => (
            <button
              key={o.value}
              className={`age-card age-card--${o.value} kr-enter`}
              style={enter(4 + i)}
              onClick={() => setAgeGroup(o.value)}
            >
              <img
                className="age-card-art"
                src={`/illustrations/age-${o.value}.svg`}
                alt=""
                width={96}
                height={96}
              />
              <b>{t(lang, o.label)}</b>
              <span>{t(lang, o.desc)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
