import { describe, expect, it } from 'vitest'
import { COMBO_MILESTONES } from '@typing-adventure/game-engine'
import { COMBO_BURST_MS } from '@/lib/kr/combo-celebration'
import {
  FIREWORK_MAX_NODES,
  fireworkNodeCount,
  fireworkPlan,
  mirrorBurst,
  type Burst,
} from '@/lib/hf/fireworks'

const sparks = (plan: Burst[]) => plan.reduce((s, b) => s + b.sparks, 0)
const n = (v: number) => sparks(fireworkPlan(v)) * 2

describe('HF fireworks plan', () => {
  it('HF-07 density strictly increases', () => {
    expect(n(5)).toBe(12)
    expect(n(10)).toBe(20)
    expect(n(20)).toBe(32)
    expect(n(50)).toBe(48)
    expect(n(5)).toBeGreaterThanOrEqual(8)
    expect(n(5)).toBeLessThan(n(10))
    expect(n(10)).toBeLessThan(n(20))
    expect(n(20)).toBeLessThan(n(50))
    expect(fireworkNodeCount(5)).toBe(14)
    expect(fireworkNodeCount(10)).toBe(24)
    expect(fireworkNodeCount(20)).toBe(36)
    expect(fireworkNodeCount(50)).toBe(54)
  })

  it('HF-07 deterministic', () => {
    expect(fireworkPlan(10)).toEqual(fireworkPlan(10))
  })

  it('HF-06 left equals right', () => {
    for (const v of COMBO_MILESTONES) {
      const left = fireworkPlan(v)
      const right = left.map(mirrorBurst)
      expect(sparks(right)).toBe(sparks(left))
      right.forEach((b, i) => expect(b.x).toBe(100 - left[i].x))
    }
  })

  it('HF-08 cap', () => {
    for (const v of COMBO_MILESTONES) {
      expect(fireworkNodeCount(v)).toBeLessThanOrEqual(FIREWORK_MAX_NODES)
    }
    expect(FIREWORK_MAX_NODES).toBe(60)
  })

  it('HF-06 E6 non-milestone', () => {
    expect(fireworkPlan(7)).toEqual([])
    expect(fireworkPlan(51)).toEqual([])
    expect(fireworkNodeCount(7)).toBe(0)
  })

  it('HF-06 finishes before burst clears', () => {
    for (const v of COMBO_MILESTONES) {
      const maxDelay = Math.max(...fireworkPlan(v).map((b) => b.delayMs))
      expect(maxDelay + 250 + 600).toBeLessThanOrEqual(COMBO_BURST_MS)
    }
  })

  it('HF-06 HF-11 bursts stay inside', () => {
    for (const v of COMBO_MILESTONES) {
      for (const b of fireworkPlan(v)) {
        expect(b.x).toBeGreaterThan(0)
        expect(b.x).toBeLessThan(100)
        expect(b.y).toBeGreaterThan(0)
        expect(b.y).toBeLessThan(100)
        expect(b.x - 22).toBeGreaterThanOrEqual(0)
        expect(b.x + 22).toBeLessThanOrEqual(100)
        expect(b.y - 22).toBeGreaterThanOrEqual(0)
        expect(b.y + 22).toBeLessThanOrEqual(100)
      }
    }
  })
})
