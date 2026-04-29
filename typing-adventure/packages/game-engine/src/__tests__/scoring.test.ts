import { describe, it, expect } from 'vitest'
import { calculateStars, calculateFinalScore, getAccuracyBonus, getComboMultiplier, calculateCharScore } from '../scoring'

describe('calculateStars', () => {
  it('returns 3 stars for high accuracy and WPM', () => {
    expect(calculateStars(25, 96, 'easy')).toBe(3)
    expect(calculateStars(20, 95, 'easy')).toBe(3)
  })

  it('returns 2 stars for medium accuracy or WPM', () => {
    expect(calculateStars(14, 86, 'easy')).toBe(2)
    expect(calculateStars(5, 90, 'easy')).toBe(2)
  })

  it('returns 1 star for low accuracy and WPM', () => {
    expect(calculateStars(5, 60, 'easy')).toBe(1)
  })

  it('respects level-specific WPM thresholds', () => {
    expect(calculateStars(15, 95, 'medium')).toBe(3)
    expect(calculateStars(10, 95, 'hard')).toBe(3)
  })
})

describe('getAccuracyBonus', () => {
  it('returns 2 for 100% accuracy', () => {
    expect(getAccuracyBonus(100)).toBe(2)
  })

  it('returns 1.5 for 95-99%', () => {
    expect(getAccuracyBonus(95)).toBe(1.5)
    expect(getAccuracyBonus(99)).toBe(1.5)
  })

  it('returns 1.2 for 90-94%', () => {
    expect(getAccuracyBonus(90)).toBe(1.2)
    expect(getAccuracyBonus(94)).toBe(1.2)
  })

  it('returns 1 for below 90%', () => {
    expect(getAccuracyBonus(89)).toBe(1)
    expect(getAccuracyBonus(50)).toBe(1)
  })
})

describe('getComboMultiplier', () => {
  it('returns 1 for combo 0', () => {
    expect(getComboMultiplier(0)).toBe(1)
  })

  it('scales linearly', () => {
    expect(getComboMultiplier(10)).toBeCloseTo(2)
    expect(getComboMultiplier(5)).toBeCloseTo(1.5)
  })
})

describe('calculateCharScore', () => {
  it('returns base score for combo 0', () => {
    expect(calculateCharScore(0)).toBe(10)
  })

  it('increases with combo', () => {
    expect(calculateCharScore(10)).toBe(20)
  })
})

describe('calculateFinalScore', () => {
  it('applies accuracy bonus', () => {
    expect(calculateFinalScore(100, 100)).toBe(200)
    expect(calculateFinalScore(100, 95)).toBe(150)
    expect(calculateFinalScore(100, 80)).toBe(100)
  })
})
