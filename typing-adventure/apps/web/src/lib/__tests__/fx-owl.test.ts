import { describe, expect, it } from 'vitest'
import { OWL_PRIORITY, idleMood, mergeOwlMood, type FxOwlMood } from '../fx/owl'

const ORDER: FxOwlMood[] = ['encourage', 'cheer', 'thinking', 'happy', 'wave', 'idle']

describe('FX owl mood', () => {
  it('FX-12 mergeOwlMood follows the priority order', () => {
    for (let i = 0; i < ORDER.length; i++) {
      for (let j = i + 1; j < ORDER.length; j++) {
        expect(mergeOwlMood(ORDER[j], ORDER[i]), `${ORDER[j]} <- ${ORDER[i]}`).toBe(ORDER[i])
        expect(mergeOwlMood(ORDER[i], ORDER[j]), `${ORDER[i]} <- ${ORDER[j]}`).toBe(ORDER[i])
      }
    }
    expect(OWL_PRIORITY.wave).toBe(OWL_PRIORITY.sleep)
    expect(mergeOwlMood('wave', 'sleep')).toBe('sleep')
    expect(mergeOwlMood('sleep', 'wave')).toBe('wave')
    expect(mergeOwlMood('cheer', 'cheer')).toBe('cheer')
  })

  it('FX-12 mood set never contains sad', () => {
    expect(Object.keys(OWL_PRIORITY)).not.toContain('sad')
  })

  it('FX-12 idleMood', () => {
    expect(idleMood(0)).toBeNull()
    expect(idleMood(4999)).toBeNull()
    expect(idleMood(5000)).toBe('wave')
    expect(idleMood(14999)).toBe('wave')
    expect(idleMood(15000)).toBe('sleep')
    expect(idleMood(60000)).toBe('sleep')
  })
})
