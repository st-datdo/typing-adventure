'use client'

import { memo, type CSSProperties } from 'react'
import type { FxState } from '@/lib/fx/director'
import { useFxStore } from '@/stores/fx-store'
import { RunnerSprite } from './sprites'

interface TierRunnerViewProps {
  runner: FxState['runner']
  suppressed: boolean
}

export function TierRunnerView({ runner, suppressed }: TierRunnerViewProps) {
  if (!runner || suppressed) return null
  return (
    <div
      key={runner.id}
      className={`fx-runner fx-runner--${runner.character}${runner.direction < 0 ? ' fx-runner--rtl' : ''}`}
      data-character={runner.character}
      aria-hidden="true"
      style={{ '--fx-dir': runner.direction } as CSSProperties}
    >
      <RunnerSprite kind={runner.character} />
    </div>
  )
}

export const TierRunner = memo(function TierRunner({ suppressed }: { suppressed: boolean }) {
  const runner = useFxStore((s) => s.runner)
  return <TierRunnerView runner={runner} suppressed={suppressed} />
})
