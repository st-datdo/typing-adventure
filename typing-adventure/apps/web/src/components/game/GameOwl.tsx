'use client'

import { OwlMascot } from '../mascot/OwlMascot'

export function GameOwl({ playing }: { playing: boolean }) {
  return <OwlMascot mood="idle" size="sm" still={playing} className="game-owl" />
}
