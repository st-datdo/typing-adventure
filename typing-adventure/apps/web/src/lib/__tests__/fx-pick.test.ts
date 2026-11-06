import { describe, expect, it } from 'vitest'
import { vi as viDict } from '@typing-adventure/i18n'
import { jitter, mulberry32 } from '../fx/rng'
import { pickNonRepeating, windowFor } from '../fx/pick'
import {
  ACCESSORIES,
  EVOLVE_VARIANTS,
  FIREWORK_KINDS,
  LABEL_STYLES,
  OWL_ENCOURAGE_KEYS,
  OWL_PRAISE_KEYS,
  PARTICLE_SHAPES,
  POP_KINDS,
  PRAISE_KEYS,
  RUNNERS,
  SKY_VARIANTS,
  STICKERS,
  SUPER_VARIANTS,
  WORD_FX_KINDS,
} from '../fx/pools'

function run<T>(pool: readonly T[], k: number, seed: number, times = 100): T[] {
  const rng = mulberry32(seed)
  let history: T[] = []
  const out: T[] = []
  for (let i = 0; i < times; i++) {
    const r = pickNonRepeating(pool, history, k, rng)
    out.push(r.item)
    history = r.history
  }
  return out
}

describe('FX variant picking', () => {
  it('FX-05 windowFor', () => {
    expect(windowFor(4)).toBe(3)
    expect(windowFor(6)).toBe(3)
    expect(windowFor(24)).toBe(3)
    expect(windowFor(2)).toBe(1)
  })

  it('FX-05 no repeat within k', () => {
    const cases: [readonly unknown[], number][] = [
      [['a', 'b', 'c', 'd'], windowFor(4)],
      [POP_KINDS, windowFor(POP_KINDS.length)],
      [PRAISE_KEYS, windowFor(PRAISE_KEYS.length)],
      [PRAISE_KEYS, 5],
      [OWL_PRAISE_KEYS, 5],
    ]
    for (const [pool, k] of cases) {
      const seq = run(pool, k, 11)
      expect(seq).toHaveLength(100)
      for (let i = 0; i < seq.length; i++) {
        const recent = seq.slice(Math.max(0, i - k), i)
        expect(recent, `${String(seq[i])} at ${i}`).not.toContain(seq[i])
        expect(pool).toContain(seq[i])
      }
    }
  })

  it('FX-05 history is capped at 8', () => {
    const rng = mulberry32(3)
    let history: string[] = []
    for (let i = 0; i < 20; i++) history = pickNonRepeating(PRAISE_KEYS, history, 5, rng).history
    expect(history.length).toBe(8)
  })

  it('FX-05 determinism', () => {
    expect(run(PRAISE_KEYS, 5, 1)).toEqual(run(PRAISE_KEYS, 5, 1))
    expect(run(PRAISE_KEYS, 5, 1)).not.toEqual(run(PRAISE_KEYS, 5, 2))
  })

  it('FX-05 mulberry32 stays in [0,1)', () => {
    const rng = mulberry32(99)
    for (let i = 0; i < 1000; i++) {
      const x = rng()
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThan(1)
    }
  })

  it('FX-05 jitter', () => {
    const rng = mulberry32(5)
    const seen = new Set<number>()
    for (let i = 0; i < 10; i++) {
      const v = jitter(36, rng)
      expect(v).toBeGreaterThanOrEqual(28.8)
      expect(v).toBeLessThanOrEqual(43.2)
      seen.add(v)
    }
    expect(seen.size).toBeGreaterThanOrEqual(2)
    for (let i = 0; i < 50; i++) expect(jitter(36, rng, 0.2, 38)).toBeLessThanOrEqual(38)
  })

  it('FX-05 FX-07 FX-08 FX-10 pool sizes', () => {
    expect(POP_KINDS.length).toBeGreaterThanOrEqual(4)
    expect(PARTICLE_SHAPES.length).toBeGreaterThanOrEqual(4)
    expect(WORD_FX_KINDS.length).toBeGreaterThanOrEqual(4)
    expect(LABEL_STYLES.length).toBeGreaterThanOrEqual(2)
    expect(RUNNERS.length).toBeGreaterThanOrEqual(3)
    expect(ACCESSORIES.length).toBeGreaterThanOrEqual(3)
    for (const p of [SKY_VARIANTS, SUPER_VARIANTS, EVOLVE_VARIANTS, FIREWORK_KINDS, STICKERS]) {
      expect(p.length).toBeGreaterThanOrEqual(2)
    }
    expect(PRAISE_KEYS.length).toBeGreaterThanOrEqual(20)
    expect(OWL_PRAISE_KEYS.length).toBeGreaterThanOrEqual(20)
    expect(OWL_ENCOURAGE_KEYS.length).toBeGreaterThanOrEqual(5)
    for (const k of [...PRAISE_KEYS, ...OWL_PRAISE_KEYS, ...OWL_ENCOURAGE_KEYS]) {
      expect(k in viDict, k).toBe(true)
    }
    for (const p of [POP_KINDS, PARTICLE_SHAPES, WORD_FX_KINDS, LABEL_STYLES, RUNNERS]) {
      expect(new Set(p).size).toBe(p.length)
    }
  })

  it('FX-11 probability', () => {
    const rng = mulberry32(42)
    let hits = 0
    for (let i = 0; i < 600; i++) if (rng() < 1 / 6) hits++
    expect(hits).toBeGreaterThanOrEqual(70)
    expect(hits).toBeLessThanOrEqual(130)
  })
})
