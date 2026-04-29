import type { Level } from './types'

export const SCORE_PER_CHAR = 10

export const COMBO_MILESTONES = [5, 10, 20, 50] as const

export const STAR_THRESHOLDS: Record<Level, { wpm: number }> = {
  easy: { wpm: 20 },
  medium: { wpm: 15 },
  hard: { wpm: 10 },
}

export function getComboMultiplier(combo: number): number {
  return 1 + combo * 0.1
}

export function getAccuracyBonus(accuracy: number): number {
  if (accuracy >= 100) return 2
  if (accuracy >= 95) return 1.5
  if (accuracy >= 90) return 1.2
  return 1
}

export function calculateCharScore(combo: number): number {
  return Math.round(SCORE_PER_CHAR * getComboMultiplier(combo))
}

export function calculateFinalScore(rawScore: number, accuracy: number): number {
  return Math.round(rawScore * getAccuracyBonus(accuracy))
}

export function calculateStars(wpm: number, accuracy: number, level: Level): 1 | 2 | 3 {
  const threshold = STAR_THRESHOLDS[level]
  if (accuracy >= 95 && wpm >= threshold.wpm) return 3
  if (accuracy >= 85 || wpm >= threshold.wpm * 0.7) return 2
  return 1
}
