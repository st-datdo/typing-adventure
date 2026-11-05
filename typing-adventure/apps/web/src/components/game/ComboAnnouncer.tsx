'use client'

import { t, tReplace } from '@typing-adventure/i18n'
import type { Lang } from '@typing-adventure/game-engine'
import { praiseKey, type Milestone } from '@/lib/kr/combo-celebration'
import { useComboCelebrationStore } from '@/stores/combo-celebration-store'
import { useSettingsStore } from '@/stores/settings-store'

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
  const lang = useSettingsStore((s) => s.lang)
  return <ComboAnnouncerView milestone={milestone} lang={lang} />
}
