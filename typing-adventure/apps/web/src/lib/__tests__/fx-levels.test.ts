import { describe, expect, it } from 'vitest'
import { EFFECTS_LEVELS, effectiveLevel, levelAllows, parseEffectsLevel } from '../fx/levels'
import { materialsFor } from '../fx/tiers'

describe('FX effects levels', () => {
  it('FX-14 parseEffectsLevel', () => {
    for (const l of EFFECTS_LEVELS) expect(parseEffectsLevel(l)).toBe(l)
    expect([...EFFECTS_LEVELS]).toEqual(['lots', 'some', 'few'])
    for (const bad of ['max', 3, null, undefined, 'x'.repeat(500), {}]) {
      expect(parseEffectsLevel(bad)).toBeNull()
    }
  })

  it('FX-14 levelAllows', () => {
    expect(levelAllows('lots', 'pop')).toBe(true)
    expect(levelAllows('some', 'pop')).toBe(true)
    expect(levelAllows('few', 'pop')).toBe(false)
    expect(levelAllows('lots', 'sparks')).toBe(true)
    expect(levelAllows('some', 'sparks')).toBe(false)
    expect(levelAllows('few', 'sparks')).toBe(false)
    expect(levelAllows('lots', 'word')).toBe(true)
    expect(levelAllows('some', 'word')).toBe(true)
    expect(levelAllows('few', 'word')).toBe(false)
    expect(levelAllows('lots', 'owlPraise')).toBe(true)
    expect(levelAllows('some', 'owlPraise')).toBe(true)
    expect(levelAllows('few', 'owlPraise')).toBe(false)
  })

  it('FX-14 materialsFor some', () => {
    for (const t of [15, 30, 40, 75, 100]) {
      expect(materialsFor(t, 'some'), String(t)).toEqual(['label', 'cheer'])
    }
    for (const t of [3, 5, 10, 20, 50]) {
      expect(materialsFor(t, 'some'), String(t)).toEqual(materialsFor(t, 'lots'))
    }
  })

  it('FX-14 materialsFor few', () => {
    expect(materialsFor(3, 'few')).toEqual(['meterLit'])
    for (const t of [5, 10, 15, 20, 30, 40, 50, 75, 100, 150]) {
      expect(materialsFor(t, 'few'), String(t)).toEqual(['label'])
    }
  })

  it('FX-15 effectiveLevel', () => {
    expect(effectiveLevel('lots', true)).toBe('few')
    expect(effectiveLevel('some', true)).toBe('few')
    expect(effectiveLevel('some', false)).toBe('some')
    expect(effectiveLevel('lots', false)).toBe('lots')
  })
})
