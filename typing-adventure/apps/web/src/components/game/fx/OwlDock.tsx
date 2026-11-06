'use client'

import { GameOwl } from '../GameOwl'
import { ComboMeter } from './ComboMeter'
import { OwlBubble } from './OwlBubble'
import { useOwlIdle } from '@/hooks/useOwlIdle'

interface OwlDockProps {
  playing: boolean
  combo: number
  suppressed: boolean
  keyStamp: number
}

export function OwlDock({ playing, combo, suppressed, keyStamp }: OwlDockProps) {
  useOwlIdle(playing && !suppressed, keyStamp)
  return (
    <>
      <span className="owl-dock">
        <GameOwl playing={playing} />
        <ComboMeter combo={combo} />
        <OwlBubble suppressed={suppressed} />
      </span>
      <span className="ta-title-text">Typing Adventure</span>
    </>
  )
}
