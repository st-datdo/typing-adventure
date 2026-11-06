'use client'

import { OwlMascot } from '../mascot/OwlMascot'
import { useFxStore } from '@/stores/fx-store'
import type { FxOwlMood } from '@/lib/fx/owl'
import type { Accessory, EvolveVariant } from '@/lib/fx/pools'

interface GameOwlViewProps {
  mood: FxOwlMood
  accessory: Accessory | null
  evolve: EvolveVariant | null
  playing: boolean
}

export function GameOwlView({ mood, accessory, evolve, playing }: GameOwlViewProps) {
  return (
    <OwlMascot
      mood={mood}
      size="sm"
      still={playing && mood === 'idle'}
      live={playing}
      accessory={accessory ?? undefined}
      evolve={evolve ?? undefined}
      className="game-owl"
    />
  )
}

export function GameOwl({ playing }: { playing: boolean }) {
  const mood = useFxStore((s) => s.owl.mood)
  const accessory = useFxStore((s) => s.accessory)
  const evolve = useFxStore((s) => s.evolve?.variant ?? null)
  return <GameOwlView mood={mood} accessory={accessory} evolve={evolve} playing={playing} />
}
