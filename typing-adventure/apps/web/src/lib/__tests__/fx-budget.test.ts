import { describe, expect, it } from 'vitest'
import {
  CANVAS_PARTICLE_CAP,
  DOM_NODE_CAP,
  allocateNodes,
  canvasBurstPlan,
  flashGate,
} from '../fx/budget'
import { mulberry32 } from '../fx/rng'
import { FIREWORK_KINDS } from '../fx/pools'

const total = (p: { bursts: { count: number }[] }) => p.bursts.reduce((s, b) => s + b.count, 0)

describe('FX budget', () => {
  it('FX-08 FX-17 caps', () => {
    expect(DOM_NODE_CAP).toBe(60)
    expect(CANVAS_PARTICLE_CAP).toBe(200)
  })

  it('FX-08 FX-17 allocateNodes', () => {
    expect(allocateNodes(0, 5)).toBe(5)
    expect(allocateNodes(58, 5)).toBe(2)
    expect(allocateNodes(60, 5)).toBe(0)
    expect(allocateNodes(70, 5)).toBe(0)
    expect(allocateNodes(0, 80)).toBe(60)
    expect(allocateNodes(5, 10, 12)).toBe(7)
  })

  it('FX-17 canvasBurstPlan confetti', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const plan = canvasBurstPlan('confetti', mulberry32(seed))
      expect(plan.bursts).toHaveLength(1)
      expect(total(plan)).toBeGreaterThanOrEqual(30)
      expect(total(plan)).toBeLessThanOrEqual(40)
    }
  })

  it('FX-17 canvasBurstPlan backdrop fireworks', () => {
    for (const kind of FIREWORK_KINDS) {
      for (let seed = 1; seed <= 50; seed++) {
        const plan = canvasBurstPlan(kind, mulberry32(seed))
        expect(plan.bursts.length).toBeGreaterThanOrEqual(4)
        expect(plan.bursts.length).toBeLessThanOrEqual(6)
        expect(total(plan)).toBeLessThanOrEqual(200)
        for (const b of plan.bursts) {
          expect(b.count).toBeGreaterThanOrEqual(30)
          expect(b.count).toBeLessThanOrEqual(40)
          expect(b.x).toBeGreaterThanOrEqual(0)
          expect(b.x).toBeLessThanOrEqual(1)
          expect(b.y).toBeGreaterThanOrEqual(0)
          expect(b.y).toBeLessThanOrEqual(0.45)
          expect(b.shape).toBe(kind)
        }
      }
    }
  })

  it('FX-16 flashGate', () => {
    let times: number[] = []
    for (const now of [0, 100, 200]) {
      const r = flashGate(times, now)
      expect(r.ok).toBe(true)
      times = r.times
    }
    const blocked = flashGate(times, 900)
    expect(blocked.ok).toBe(false)
    expect(blocked.times).toEqual([0, 100, 200])
    const later = flashGate(times, 1000)
    expect(later.ok).toBe(true)
    expect(later.times).toEqual([100, 200, 1000])
    expect(flashGate([0, 50], 5000).times).toEqual([5000])
  })
})
