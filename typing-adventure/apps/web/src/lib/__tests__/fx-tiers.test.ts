import { describe, expect, it } from 'vitest'
import { COMBO_MILESTONES } from '@typing-adventure/game-engine'
import { materialsFor, meterLevel, nextTierInfo, noteStep, soundCue, tierOf } from '../fx/tiers'

describe('FX tiers', () => {
  it('FX-02 tierOf hits', () => {
    for (const n of [3, 5, 10, 15, 20, 30, 40, 50, 75, 100, 150, 200, 250]) {
      expect(tierOf(n), String(n)).toBe(n)
    }
  })

  it('FX-02 tierOf misses', () => {
    for (const n of [0, 1, 2, 4, 6, 7, 8, 9, 51, 101, 149, 151]) {
      expect(tierOf(n), String(n)).toBeNull()
    }
  })

  it('FX-02 milestones untouched', () => {
    expect([...COMBO_MILESTONES]).toEqual([5, 10, 20, 50])
  })

  it('FX-06 meterLevel', () => {
    expect(meterLevel(0)).toBe('off')
    expect(meterLevel(2)).toBe('off')
    expect(meterLevel(3)).toBe('lit')
    expect(meterLevel(9)).toBe('lit')
    expect(meterLevel(10)).toBe('hot')
    expect(meterLevel(29)).toBe('hot')
    expect(meterLevel(30)).toBe('super')
    expect(meterLevel(500)).toBe('super')
  })

  it('FX-06 nextTierInfo', () => {
    expect(nextTierInfo(7)).toEqual({ prev: 5, next: 10, progress: 0.4 })
    expect(nextTierInfo(0)).toEqual({ prev: 0, next: 3, progress: 0 })
    const far = nextTierInfo(120)
    expect(far.prev).toBe(100)
    expect(far.next).toBe(150)
    expect(far.progress).toBeCloseTo(0.4)
  })

  it('FX-09 noteStep', () => {
    expect(noteStep(1)).toBe(0)
    expect(noteStep(4)).toBe(0)
    expect(noteStep(5)).toBe(1)
    expect(noteStep(9)).toBe(1)
    expect(noteStep(44)).toBe(8)
    expect(noteStep(45)).toBe(9)
    expect(noteStep(300)).toBe(9)
  })

  it('FX-04 FX-09 soundCue', () => {
    expect(soundCue(3)).toEqual({ kind: 'tier', sound: 'pop' })
    expect(soundCue(5)).toEqual({ kind: 'tier', sound: 'sparkle' })
    expect(soundCue(10)).toEqual({ kind: 'tier', sound: 'sparkle' })
    expect(soundCue(15)).toEqual({ kind: 'tier', sound: 'boing' })
    expect(soundCue(20)).toEqual({ kind: 'tier', sound: 'fanfare' })
    expect(soundCue(30)).toEqual({ kind: 'note', step: 6 })
    expect(soundCue(40)).toEqual({ kind: 'tier', sound: 'sticker' })
    for (const n of [50, 75, 100, 150]) {
      expect(soundCue(n)).toEqual({ kind: 'tier', sound: 'fanfare' })
    }
    expect(soundCue(7)).toEqual({ kind: 'note', step: 1 })
  })

  it('FX-04 materialsFor lots', () => {
    const base = ['label', 'cheer']
    expect(materialsFor(3, 'lots')).toEqual(['meterLit'])
    expect(materialsFor(5, 'lots')).toEqual(base)
    expect(materialsFor(10, 'lots')).toEqual([...base, 'confetti'])
    expect(materialsFor(15, 'lots')).toEqual([...base, 'runner'])
    expect(materialsFor(20, 'lots')).toEqual([...base, 'sky', 'accessory'])
    expect(materialsFor(30, 'lots')).toEqual([...base, 'super'])
    expect(materialsFor(40, 'lots')).toEqual([...base, 'rain'])
    expect(materialsFor(50, 'lots')).toEqual([...base, 'evolve'])
    for (const t of [75, 100, 150]) {
      expect(materialsFor(t, 'lots')).toEqual([...base, 'fireworks'])
    }
  })
})
