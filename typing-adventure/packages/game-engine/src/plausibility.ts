import { getAccuracyBonus, SCORE_PER_CHAR } from './scoring'

export const MAX_WPM = 200

export interface SessionClaim {
  wpm: number
  cps: number
  accuracy: number
  score: number
  timeSeconds: number
  maxCombo: number
}

function maxCorrectChars(cps: number, timeSeconds: number): number {
  return Math.floor((cps + 0.005) * (timeSeconds + 0.05)) + 1
}

function maxRawScore(chars: number, maxCombo: number): number {
  const ramp = Math.min(chars, maxCombo)
  return SCORE_PER_CHAR * chars + (ramp * (ramp + 1)) / 2 + (chars - ramp) * maxCombo
}

export function checkSessionPlausibility(claim: SessionClaim): string | null {
  if (claim.wpm > MAX_WPM) return `wpm above ${MAX_WPM}`
  if (Math.abs(claim.wpm - 12 * claim.cps) > 1) return 'wpm does not match cps'
  const chars = maxCorrectChars(claim.cps, claim.timeSeconds)
  if (claim.maxCombo > chars) return 'maxCombo above typed chars'
  const scoreMax = Math.round(getAccuracyBonus(claim.accuracy) * maxRawScore(chars, claim.maxCombo))
  if (claim.score > scoreMax) return 'score above maximum'
  return null
}
