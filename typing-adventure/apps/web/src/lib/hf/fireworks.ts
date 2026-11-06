export interface Burst {
  x: number
  y: number
  delayMs: number
  sparks: number
}

export const FIREWORK_MAX_NODES = 60

const POSITIONS: ReadonlyArray<readonly [number, number]> = [
  [50, 30],
  [28, 58],
  [72, 62],
]

const DENSITY: Record<number, { bursts: number; sparks: number }> = {
  5: { bursts: 1, sparks: 6 },
  10: { bursts: 2, sparks: 5 },
  20: { bursts: 2, sparks: 8 },
  50: { bursts: 3, sparks: 8 },
}

export function fireworkPlan(value: number): Burst[] {
  const d = DENSITY[value]
  if (!d) return []
  return POSITIONS.slice(0, d.bursts).map(([x, y], k) => ({
    x,
    y,
    delayMs: 150 * k,
    sparks: d.sparks,
  }))
}

export function mirrorBurst(b: Burst): Burst {
  return { ...b, x: 100 - b.x }
}

export function fireworkNodeCount(value: number): number {
  const plan = fireworkPlan(value)
  return plan.reduce((s, b) => s + b.sparks + 1, 0) * 2
}
