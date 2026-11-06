'use client'

import { useEffect } from 'react'
import { t } from '@typing-adventure/i18n'
import type { Lang } from '@typing-adventure/game-engine'
import { COMBO_BURST_MS, praiseKey, type Milestone } from '@/lib/kr/combo-celebration'
import { useComboCelebrationStore } from '@/stores/combo-celebration-store'
import { useSettingsStore } from '@/stores/settings-store'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { Icon } from '@/components/ui/icons/Icon'
import { ComboFireworks } from './ComboFireworks'

const SIDES = ['left', 'right'] as const

interface ComboBurstViewProps {
  milestone: Milestone | null
  lang: Lang
  reducedMotion: boolean
  suppressed?: boolean
}

export function ComboBurstView({
  milestone,
  lang,
  reducedMotion,
  suppressed,
}: ComboBurstViewProps) {
  if (!milestone || suppressed) return null
  const praise = t(lang, praiseKey(milestone.value))
  return (
    <div key={milestone.id} className="combo-burst" aria-hidden="true">
      {SIDES.map((side) => (
        <div key={side} className={`combo-side combo-side--${side}`}>
          {!reducedMotion && <ComboFireworks value={milestone.value} side={side} />}
          <span className="combo-burst-value">
            <Icon name="flame" size={28} />x{milestone.value}
          </span>
          <span className="combo-burst-praise">{praise}</span>
        </div>
      ))}
    </div>
  )
}

export function ComboBurst({ suppressed = false }: { suppressed?: boolean }) {
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

  return (
    <ComboBurstView
      milestone={milestone}
      lang={lang}
      reducedMotion={reducedMotion}
      suppressed={suppressed}
    />
  )
}
