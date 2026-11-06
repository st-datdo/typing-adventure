'use client'

import { memo } from 'react'
import { t } from '@typing-adventure/i18n'
import type { Lang } from '@typing-adventure/game-engine'
import type { FxState } from '@/lib/fx/director'
import { useFxStore } from '@/stores/fx-store'
import { useSettingsStore } from '@/stores/settings-store'

interface OwlBubbleViewProps {
  bubble: FxState['bubble']
  lang: Lang
  suppressed: boolean
}

export function OwlBubbleView({ bubble, lang, suppressed }: OwlBubbleViewProps) {
  if (!bubble || suppressed) return null
  return (
    <div key={bubble.id} className="fx-owl-bubble" data-kind={bubble.kind} aria-hidden="true">
      {t(lang, bubble.text)}
    </div>
  )
}

export const OwlBubble = memo(function OwlBubble({ suppressed }: { suppressed: boolean }) {
  const bubble = useFxStore((s) => s.bubble)
  const labelAlive = useFxStore((s) => s.label !== null)
  const lang = useSettingsStore((s) => s.lang)
  return <OwlBubbleView bubble={labelAlive ? null : bubble} lang={lang} suppressed={suppressed} />
})
