import type { AgeGroup, AgeProfile, GameMode } from './types'

export const AGE_PROFILES: Record<AgeGroup, AgeProfile> = {
  little: { allowedModes: [], showSpeedStats: false, social: false },
  kid: { allowedModes: ['classic', 'lesson'], showSpeedStats: false, social: false },
  big: { allowedModes: ['classic', 'lesson', 'timeAttack', 'challenge'], showSpeedStats: true, social: true },
}

export function isModeAllowed(age: AgeGroup | null, mode: GameMode): boolean {
  if (age === null) return true
  return AGE_PROFILES[age].allowedModes.includes(mode)
}
