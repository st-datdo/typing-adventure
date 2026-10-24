'use client'

import type { ReactNode } from 'react'

export type MascotMood = 'idle' | 'wave' | 'happy' | 'sleep'

interface MascotProps {
  mood?: MascotMood
  children?: ReactNode
  bubbleKey?: string | number
}

export function Mascot({ mood = 'idle', children, bubbleKey }: MascotProps) {
  return (
    <div className="little-mascot-row">
      <div className={`little-mascot little-mascot--${mood}`} aria-hidden>
        🦉{mood === 'sleep' && <span className="little-zzz">💤</span>}
      </div>
      {children && (
        <div key={bubbleKey} className="little-bubble" role="status">
          {children}
        </div>
      )}
    </div>
  )
}
