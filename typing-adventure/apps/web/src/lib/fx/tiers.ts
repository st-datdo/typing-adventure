import type { SoundType } from '@/lib/audio/sound-engine'
import type { EffectsLevel } from './levels'

export const TIER_BASE = [3, 5, 10, 15, 20, 30, 40, 50, 75, 100] as const
const TIER_STEP = 50
const LAST_BASE = 100

export type MeterLevel = 'off' | 'lit' | 'hot' | 'super'

export type Material =
  | 'meterLit'
  | 'label'
  | 'cheer'
  | 'confetti'
  | 'runner'
  | 'sky'
  | 'accessory'
  | 'super'
  | 'rain'
  | 'evolve'
  | 'fireworks'

export type SoundCue = { kind: 'tier'; sound: SoundType } | { kind: 'note'; step: number }

export function tierOf(combo: number): number | null {
  if ((TIER_BASE as readonly number[]).includes(combo)) return combo
  if (combo > LAST_BASE && (combo - LAST_BASE) % TIER_STEP === 0) return combo
  return null
}

function tierAfter(combo: number): number {
  for (const t of TIER_BASE) if (t > combo) return t
  return LAST_BASE + (Math.floor((combo - LAST_BASE) / TIER_STEP) + 1) * TIER_STEP
}

function tierAtOrBelow(combo: number): number {
  if (combo < TIER_BASE[0]) return 0
  if (combo >= LAST_BASE) return LAST_BASE + Math.floor((combo - LAST_BASE) / TIER_STEP) * TIER_STEP
  let prev = 0
  for (const t of TIER_BASE) if (t <= combo) prev = t
  return prev
}

export function nextTierInfo(combo: number): { prev: number; next: number; progress: number } {
  const c = Math.max(0, combo)
  const prev = tierAtOrBelow(c)
  const next = tierAfter(c)
  return { prev, next, progress: (c - prev) / (next - prev) }
}

export function meterLevel(combo: number): MeterLevel {
  if (combo >= 30) return 'super'
  if (combo >= 10) return 'hot'
  if (combo >= 3) return 'lit'
  return 'off'
}

export function noteStep(combo: number): number {
  return Math.min(Math.floor(Math.max(0, combo) / 5), 9)
}

const TIER_SOUNDS: Record<number, SoundType> = {
  3: 'pop',
  5: 'sparkle',
  10: 'sparkle',
  15: 'boing',
  20: 'fanfare',
  40: 'sticker',
  50: 'fanfare',
}

export function soundCue(combo: number): SoundCue {
  const tier = tierOf(combo)
  if (tier !== null) {
    const sound = tier >= 75 ? 'fanfare' : TIER_SOUNDS[tier]
    if (sound) return { kind: 'tier', sound }
  }
  return { kind: 'note', step: noteStep(combo) }
}

export const TIER_MATERIALS: Record<number, Material[]> = {
  3: ['meterLit'],
  5: ['label', 'cheer'],
  10: ['label', 'cheer', 'confetti'],
  15: ['label', 'cheer', 'runner'],
  20: ['label', 'cheer', 'sky', 'accessory'],
  30: ['label', 'cheer', 'super'],
  40: ['label', 'cheer', 'rain'],
  50: ['label', 'cheer', 'evolve'],
  75: ['label', 'cheer', 'fireworks'],
}

const SOME_SKIPS: readonly Material[] = ['runner', 'super', 'rain', 'fireworks']

export function materialsFor(tier: number, level: EffectsLevel = 'lots'): Material[] {
  const key = tier >= 75 ? 75 : tier
  const all = TIER_MATERIALS[key] ?? []
  if (level === 'few') return tier === 3 ? ['meterLit'] : all.length ? ['label'] : []
  if (level === 'some') return all.filter((m) => !SOME_SKIPS.includes(m))
  return [...all]
}
