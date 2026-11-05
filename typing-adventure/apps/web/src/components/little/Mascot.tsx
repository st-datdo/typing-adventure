'use client'

import type { ReactNode } from 'react'
import { OwlMascot, type OwlMood } from '../mascot/OwlMascot'

export type MascotMood = OwlMood

interface MascotProps {
  mood?: MascotMood
  children?: ReactNode
  bubbleKey?: string | number
}

export function Mascot({ mood = 'idle', children, bubbleKey }: MascotProps) {
  return (
    <div className="little-mascot-row">
      <div className={`little-mascot little-mascot--${mood}`} aria-hidden>
        <OwlMascot mood={mood} size="lg" />
      </div>
      {children && (
        <div key={bubbleKey} className="little-bubble" role="status">
          {children}
        </div>
      )}
    </div>
  )
}
