'use client'

import { GameOwl } from '../GameOwl'
import { ComboMeter } from './ComboMeter'

interface OwlDockProps {
  playing: boolean
  combo: number
  suppressed: boolean
}

export function OwlDock({ playing, combo }: OwlDockProps) {
  return (
    <>
      <span className="owl-dock">
        <GameOwl playing={playing} />
        <ComboMeter combo={combo} />
      </span>
      <span className="ta-title-text">Typing Adventure</span>
    </>
  )
}
