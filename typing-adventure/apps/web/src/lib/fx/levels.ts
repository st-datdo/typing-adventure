export const EFFECTS_LEVELS = ['lots', 'some', 'few'] as const

export type EffectsLevel = (typeof EFFECTS_LEVELS)[number]

export type EffectGroup = 'pop' | 'sparks' | 'word' | 'owlPraise'

const ALLOWED: Record<EffectGroup, readonly EffectsLevel[]> = {
  pop: ['lots', 'some'],
  sparks: ['lots'],
  word: ['lots', 'some'],
  owlPraise: ['lots', 'some'],
}

export function parseEffectsLevel(v: unknown): EffectsLevel | null {
  return typeof v === 'string' && (EFFECTS_LEVELS as readonly string[]).includes(v)
    ? (v as EffectsLevel)
    : null
}

export function effectiveLevel(level: EffectsLevel, reduced: boolean): EffectsLevel {
  return reduced ? 'few' : level
}

export function levelAllows(level: EffectsLevel, group: EffectGroup): boolean {
  return ALLOWED[group].includes(level)
}
