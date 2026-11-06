import type { Rng } from './rng'

const HISTORY_CAP = 8

export function windowFor(n: number): number {
  return Math.max(0, Math.min(3, n - 1))
}

export function pickNonRepeating<T>(
  pool: readonly T[],
  history: readonly T[],
  k: number,
  rng: Rng,
): { item: T; history: T[] } {
  const recent = k > 0 ? history.slice(-k) : []
  const fresh = pool.filter((x) => !recent.includes(x))
  const from = fresh.length > 0 ? fresh : pool
  const item = from[Math.min(from.length - 1, Math.floor(rng() * from.length))]
  return { item, history: [...history, item].slice(-HISTORY_CAP) }
}
