'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { CONFETTI_LIFETIME_MS, confettiPieces } from '@/lib/kr/confetti'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

export function Confetti({ seed = 1, count = 24 }: { seed?: number; count?: number }) {
  const reducedMotion = usePrefersReducedMotion()
  const [alive, setAlive] = useState(true)
  const pieces = useMemo(() => confettiPieces(count, seed), [count, seed])

  useEffect(() => {
    const timer = setTimeout(() => setAlive(false), CONFETTI_LIFETIME_MS)
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') setAlive(false)
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  if (!alive || reducedMotion) return null
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={
            {
              left: `${p.left}%`,
              background: p.color,
              animationDelay: `${p.delay}ms`,
              animationDuration: `${p.duration}ms`,
              '--rot': `${p.rotate}deg`,
              '--drift': `${p.drift}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
