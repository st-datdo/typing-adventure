'use client'

import { useEffect } from 'react'
import { t, tReplace } from '@typing-adventure/i18n'
import type { Lang } from '@typing-adventure/game-engine'
import { COMBO_BURST_MS, praiseKey, type Milestone } from '@/lib/kr/combo-celebration'
import { useComboCelebrationStore } from '@/stores/combo-celebration-store'
import { useSettingsStore } from '@/stores/settings-store'

export function scheduleClear(milestone: Milestone, clear: (id?: number) => void): () => void {
  const id = milestone.id
  const timer = setTimeout(() => clear(id), COMBO_BURST_MS)
  return () => clearTimeout(timer)
}

export function ComboAnnouncerView({
  milestone,
  lang,
}: {
  milestone: Milestone | null
  lang: Lang
}) {
  return (
    <div className="sr-only" aria-live="polite">
      {milestone
        ? tReplace(lang, 'comboAnnounce', milestone.value, t(lang, praiseKey(milestone.value)))
        : ''}
    </div>
  )
}

export function ComboAnnouncer() {
  const milestone = useComboCelebrationStore((s) => s.milestone)
  const clear = useComboCelebrationStore((s) => s.clear)
  const lang = useSettingsStore((s) => s.lang)
  useEffect(() => {
    if (!milestone) return
    return scheduleClear(milestone, clear)
  }, [milestone, clear])
  return <ComboAnnouncerView milestone={milestone} lang={lang} />
}
