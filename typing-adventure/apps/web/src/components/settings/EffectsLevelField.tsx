'use client'

import { t, type TranslationKey } from '@typing-adventure/i18n'
import type { Lang } from '@typing-adventure/game-engine'
import { ChoiceCards, type ChoiceOption } from '@/components/ui/ChoiceCards'
import { useSettingsStore } from '@/stores/settings-store'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import type { EffectsLevel } from '@/lib/fx/levels'

const LABEL_ID = 'set-fx-label'
const DESC_ID = 'set-fx-desc'
const HINT_ID = 'set-fx-hint'

const OPTIONS: {
  value: EffectsLevel
  label: TranslationKey
  hint: TranslationKey
  icon: ChoiceOption<EffectsLevel>['icon']
}[] = [
  { value: 'lots', label: 'fxLots', hint: 'fxLotsHint', icon: 'rainbow' },
  { value: 'some', label: 'fxSome', hint: 'fxSomeHint', icon: 'sparkle' },
  { value: 'few', label: 'fxFew', hint: 'fxFewHint', icon: 'star' },
]

interface EffectsLevelFieldViewProps {
  lang: Lang
  value: EffectsLevel
  reduced: boolean
  onChange: (value: EffectsLevel) => void
}

export function EffectsLevelFieldView({
  lang,
  value,
  reduced,
  onChange,
}: EffectsLevelFieldViewProps) {
  const current = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0]
  return (
    <div className="ta-field">
      <div className="ui-label" id={LABEL_ID}>
        {t(lang, 'fxLabel')}
      </div>
      <div className="ta-hint" id={DESC_ID}>
        {t(lang, 'fxDesc')}
      </div>
      <ChoiceCards
        labelId={LABEL_ID}
        describedBy={`${DESC_ID} ${HINT_ID}`}
        columns={3}
        value={current.value}
        onChange={onChange}
        options={OPTIONS.map((o) => ({ value: o.value, label: t(lang, o.label), icon: o.icon }))}
      />
      <div className="ta-hint" aria-live="polite">
        <span id={HINT_ID}>{t(lang, current.hint)}</span>
      </div>
      {reduced && (
        <div className="ta-hint" role="note">
          {t(lang, 'fxReducedNote')}
        </div>
      )}
    </div>
  )
}

export function EffectsLevelField() {
  const lang = useSettingsStore((s) => s.lang)
  const value = useSettingsStore((s) => s.effectsLevel)
  const setEffectsLevel = useSettingsStore((s) => s.setEffectsLevel)
  const reduced = usePrefersReducedMotion()
  return (
    <EffectsLevelFieldView lang={lang} value={value} reduced={reduced} onChange={setEffectsLevel} />
  )
}
