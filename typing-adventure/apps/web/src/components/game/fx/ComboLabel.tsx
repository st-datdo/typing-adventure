'use client'

import { memo, type CSSProperties } from 'react'
import { t } from '@typing-adventure/i18n'
import type { Lang } from '@typing-adventure/game-engine'
import type { FxState } from '@/lib/fx/director'
import { useFxStore } from '@/stores/fx-store'
import { useSettingsStore } from '@/stores/settings-store'

interface ComboLabelViewProps {
  label: FxState['label']
  lang: Lang
  suppressed: boolean
}

export function ComboLabelView({ label, lang, suppressed }: ComboLabelViewProps) {
  if (!label || suppressed) return null
  const cls = [
    'fx-combo-label',
    `fx-combo-label--${label.style}`,
    `fx-combo-label--band-${label.band}`,
    label.animate ? '' : 'fx-combo-label--static',
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <div
      key={label.id}
      className={cls}
      data-tier={label.tier}
      data-style={label.style}
      aria-hidden="true"
      style={{ '--fx-tilt': `${label.tilt}deg`, '--fx-rise': `-${label.rise}px` } as CSSProperties}
    >
      <span className="fx-combo-label-value">x{label.tier}</span>
      <span className="fx-combo-label-praise">{t(lang, label.praise)}</span>
    </div>
  )
}

export const ComboLabel = memo(function ComboLabel({ suppressed }: { suppressed: boolean }) {
  const label = useFxStore((s) => s.label)
  const lang = useSettingsStore((s) => s.lang)
  return <ComboLabelView label={label} lang={lang} suppressed={suppressed} />
})
