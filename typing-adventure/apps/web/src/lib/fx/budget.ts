import { randInt, type Rng } from './rng'
import type { FireworkKind, ParticleShape } from './pools'

export const DOM_NODE_CAP = 60
export const CANVAS_PARTICLE_CAP = 200
export const FLASH_MAX = 3
export const FLASH_WINDOW_MS = 1000

export type CanvasKind = 'confetti' | FireworkKind

export interface CanvasBurst {
  x: number
  y: number
  count: number
  shape: ParticleShape | FireworkKind
}

const CONFETTI_SHAPES: readonly ParticleShape[] = ['star', 'heart', 'dot', 'sparkle']

export function allocateNodes(alive: number, requested: number, cap = DOM_NODE_CAP): number {
  return Math.max(0, Math.min(requested, cap - alive))
}

export function canvasBurstPlan(kind: CanvasKind, rng: Rng): { bursts: CanvasBurst[] } {
  if (kind === 'confetti') {
    const shape = CONFETTI_SHAPES[Math.floor(rng() * CONFETTI_SHAPES.length)]
    return { bursts: [{ x: 0.5, y: 0.5, count: randInt(32, 40, rng), shape }] }
  }
  const n = randInt(4, 6, rng)
  const max = Math.min(40, Math.floor(CANVAS_PARTICLE_CAP / n))
  const bursts: CanvasBurst[] = []
  for (let i = 0; i < n; i++) {
    const lane = (i + 0.2 + rng() * 0.6) / n
    bursts.push({
      x: Math.min(0.97, Math.max(0.03, lane)),
      y: 0.08 + rng() * 0.34,
      count: randInt(30, max, rng),
      shape: kind,
    })
  }
  return { bursts }
}

export function flashGate(
  times: readonly number[],
  now: number,
  max = FLASH_MAX,
  windowMs = FLASH_WINDOW_MS,
): { ok: boolean; times: number[] } {
  const kept = times.filter((t) => now - t < windowMs)
  if (kept.length >= max) return { ok: false, times: kept }
  return { ok: true, times: [...kept, now] }
}
