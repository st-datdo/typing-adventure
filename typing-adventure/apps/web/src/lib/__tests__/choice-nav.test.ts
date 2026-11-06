import { describe, expect, it } from 'vitest'
import { allowedModes, nextIndex } from '../kr/choice-nav'

describe('choice nav', () => {
  it('KR-11 arrows move and wrap', () => {
    expect(nextIndex('ArrowRight', 0, 4)).toBe(1)
    expect(nextIndex('ArrowDown', 3, 4)).toBe(0)
    expect(nextIndex('ArrowLeft', 0, 4)).toBe(3)
    expect(nextIndex('ArrowUp', 2, 4)).toBe(1)
  })

  it('KR-11 Home and End jump to the ends', () => {
    expect(nextIndex('Home', 2, 4)).toBe(0)
    expect(nextIndex('End', 0, 4)).toBe(3)
  })

  it('KR-11 other keys return null', () => {
    expect(nextIndex('a', 0, 4)).toBeNull()
    expect(nextIndex('Enter', 0, 4)).toBeNull()
  })

  it('KR-11 allowed modes follow the age profile', () => {
    expect(allowedModes('kid')).toEqual(['classic', 'lesson'])
    expect(allowedModes('big')).toEqual(['classic', 'lesson', 'timeAttack', 'challenge'])
  })
})
