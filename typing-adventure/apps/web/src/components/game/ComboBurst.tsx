'use client'

import { useEffect, type CSSProperties } from 'react'
import { t } from '@typing-adventure/i18n'
import type { Lang } from '@typing-adventure/game-engine'
import { COMBO_BURST_MS, praiseKey, type Milestone } from '@/lib/kr/combo-celebration'
import { useComboCelebrationStore } from '@/stores/combo-celebration-store'
import { useSettingsStore } from '@/stores/settings-store'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { Icon } from '@/components/ui/icons/Icon'

const SPARKS = [0, 1, 2, 3, 4, 5, 6, 7]

interface ComboBurstViewProps {
  milestone: Milestone | null
  lang: Lang
  reducedMotion: boolean
}

export function ComboBurstView({ milestone, lang, reducedMotion }: ComboBurstViewProps) {
  if (!milestone) return null
  return (
    <div key={milestone.id} className="combo-burst" aria-hidden="true">
      {!reducedMotion &&
        SPARKS.map((i) => (
          <span
            key={i}
            className="combo-spark"
            style={{ '--a': `${i * 45}deg` } as CSSProperties}
          />
        ))}
      <span className="combo-burst-value">
        <Icon name="flame" size={28} />x{milestone.value}
      </span>
      <span className="combo-burst-praise">{t(lang, praiseKey(milestone.value))}</span>
    </div>
  )
}

export function ComboBurst() {
  const milestone = useComboCelebrationStore((s) => s.milestone)
  const clear = useComboCelebrationStore((s) => s.clear)
  const lang = useSettingsStore((s) => s.lang)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (!milestone) return
    const id = milestone.id
    const timer = setTimeout(() => clear(id), COMBO_BURST_MS)
    return () => clearTimeout(timer)
  }, [milestone, clear])

  return <ComboBurstView milestone={milestone} lang={lang} reducedMotion={reducedMotion} />
}
