'use client'

const PIECES = [
  { x: -120, y: -150, r: -30, d: 0 },
  { x: -60, y: -200, r: 15, d: 40 },
  { x: 0, y: -230, r: 0, d: 20 },
  { x: 70, y: -190, r: -15, d: 60 },
  { x: 130, y: -140, r: 30, d: 10 },
  { x: -30, y: -120, r: 20, d: 80 },
  { x: 40, y: -110, r: -20, d: 90 },
]

interface BurstProps {
  emoji: string
  id: number
  big?: boolean
}

export function Burst({ emoji, id, big }: BurstProps) {
  if (id === 0) return null
  const sparks = ['✨', '⭐', emoji, '✨', emoji, '🌟', '✨']
  return (
    <div key={id} className={`little-burst ${big ? 'little-burst--big' : ''}`} aria-hidden>
      {PIECES.map((p, i) => (
        <span
          key={i}
          className="little-burst-piece"
          style={{
            ['--bx' as string]: `${p.x}px`,
            ['--by' as string]: `${p.y}px`,
            ['--br' as string]: `${p.r}deg`,
            animationDelay: `${p.d}ms`,
          }}
        >
          {sparks[i]}
        </span>
      ))}
    </div>
  )
}
