import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { INITIAL_FX, type FxEvent } from '@/lib/fx/director'
import { mulberry32 } from '@/lib/fx/rng'

type Mod = typeof import('../fx-store')
let mod: Mod

const key = (combo: number, correct = true, now = combo * 300): FxEvent => ({
  type: 'key',
  correct,
  combo,
  index: combo,
  char: 'a',
  word: null,
  now,
})

beforeEach(async () => {
  vi.resetModules()
  vi.useFakeTimers()
  mod = await import('../fx-store')
  mod.__setRng(mulberry32(7))
})

afterEach(() => {
  vi.useRealTimers()
})

const st = () => mod.useFxStore.getState()

describe('fx store', () => {
  it('FX-03 label expires on schedule and an old timer never clears a newer label', () => {
    for (let c = 1; c <= 5; c++) st().dispatch(key(c))
    expect(st().label?.tier).toBe(5)
    vi.advanceTimersByTime(899)
    expect(st().label).not.toBeNull()
    vi.advanceTimersByTime(1)
    expect(st().label).toBeNull()

    st().dispatch(key(0, false))
    for (let c = 1; c <= 5; c++) st().dispatch(key(c, true, 10_000 + c * 300))
    vi.advanceTimersByTime(500)
    for (let c = 6; c <= 10; c++) st().dispatch(key(c, true, 12_000 + c * 300))
    expect(st().label?.tier).toBe(10)
    vi.advanceTimersByTime(400)
    expect(st().label?.tier).toBe(10)
    vi.advanceTimersByTime(500)
    expect(st().label).toBeNull()
  })

  it('FX-18 reset clears every slot and held state synchronously', () => {
    for (let c = 1; c <= 30; c++) st().dispatch(key(c))
    expect(st().sky).not.toBeNull()
    expect(st().label).not.toBeNull()
    st().reset()
    const s = st()
    for (const k of [
      'pop',
      'sparks',
      'word',
      'label',
      'confetti',
      'runner',
      'rain',
      'fireworks',
      'evolve',
      'bubble',
      'sky',
      'accessory',
      'superMode',
    ] as const) {
      expect(s[k], k).toBeNull()
    }
    expect(s.owl.mood).toBe('idle')
    expect(s.combo).toBe(INITIAL_FX.combo)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('FX-14 level change applies to the next key', () => {
    st().dispatch(key(1))
    expect(st().pop).not.toBeNull()
    st().dispatch({ type: 'level', value: 'few' })
    st().dispatch(key(2))
    vi.advanceTimersByTime(400)
    expect(st().pop).toBeNull()
    st().dispatch(key(3))
    expect(st().pop).toBeNull()
  })

  it('FX-12 idle moods and wake-up', () => {
    st().dispatch(key(1))
    st().dispatch({ type: 'idle', mood: 'wave' })
    expect(st().owl.mood).toBe('wave')
    st().dispatch({ type: 'idle', mood: 'sleep' })
    expect(st().owl.mood).toBe('sleep')
    st().dispatch(key(2))
    expect(st().owl.mood).toBe('happy')
    vi.advanceTimersByTime(799)
    expect(st().owl.mood).toBe('happy')
    vi.advanceTimersByTime(1)
    expect(st().owl.mood).toBe('idle')
  })
})
