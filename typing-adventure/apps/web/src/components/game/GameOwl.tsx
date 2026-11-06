'use client'

import { OwlMascot } from '../mascot/OwlMascot'
import { useComboCelebrationStore } from '@/stores/combo-celebration-store'

export function GameOwl({ playing }: { playing: boolean }) {
  const celebrating = useComboCelebrationStore((s) => s.milestone !== null)
  return (
    <OwlMascot
      mood={celebrating ? 'happy' : 'idle'}
      size="sm"
      still={playing && !celebrating}
      className="game-owl"
    />
  )
}
