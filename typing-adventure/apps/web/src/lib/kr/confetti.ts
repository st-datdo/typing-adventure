export const CONFETTI_LIFETIME_MS = 2500
export const CONFETTI_COLORS = [
  'var(--kr-primary)',
  'var(--kr-play)',
  'var(--kr-fun)',
  'var(--kr-success)',
]

export interface ConfettiPiece {
  left: number
  delay: number
  duration: number
  rotate: number
  drift: number
  color: string
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function confettiPieces(count: number, seed: number): ConfettiPiece[] {
  const rand = mulberry32(seed)
  return Array.from({ length: count }, (_, i) => ({
    left: Math.round(rand() * 1000) / 10,
    delay: Math.round(rand() * 300),
    duration: 1600 + Math.round(rand() * 200),
    rotate: Math.round(rand() * 720 - 360),
    drift: Math.round(rand() * 80 - 40),
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  }))
}
