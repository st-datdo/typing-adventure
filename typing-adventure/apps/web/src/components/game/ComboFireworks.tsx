'use client'

import { memo, type CSSProperties } from 'react'
import { fireworkPlan, mirrorBurst } from '@/lib/hf/fireworks'

const COLORS = ['var(--kr-play)', 'var(--kr-fun)', 'var(--kr-primary)', 'var(--kr-success)']

interface ComboFireworksProps {
  value: number
  side: 'left' | 'right'
}

function ComboFireworksImpl({ value, side }: ComboFireworksProps) {
  const plan = fireworkPlan(value)
  const bursts = side === 'right' ? plan.map(mirrorBurst) : plan
  if (bursts.length === 0) return null
  return (
    <span className="fw-layer" aria-hidden="true">
      {bursts.map((b, k) => (
        <span
          key={k}
          className="fw-burst"
          style={{ '--x': `${b.x}%`, '--y': `${b.y}%`, '--d': `${b.delayMs}ms` } as CSSProperties}
        >
          <span className="fw-rocket" />
          {Array.from({ length: b.sparks }, (_, i) => (
            <span
              key={i}
              className="fw-spark"
              style={
                {
                  '--a': `${(i * 360) / b.sparks + k * 20}deg`,
                  '--c': COLORS[(i + k) % COLORS.length],
                } as CSSProperties
              }
            />
          ))}
        </span>
      ))}
    </span>
  )
}

export const ComboFireworks = memo(ComboFireworksImpl)
