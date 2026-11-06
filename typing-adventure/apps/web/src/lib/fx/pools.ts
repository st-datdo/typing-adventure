import type { TranslationKey } from '@typing-adventure/i18n'

export const POP_KINDS = ['squash', 'wiggle', 'hop', 'flip', 'jelly', 'tint'] as const
export type PopKind = (typeof POP_KINDS)[number]

export const PARTICLE_SHAPES = ['star', 'dot', 'heart', 'bubble', 'sparkle', 'note'] as const
export type ParticleShape = (typeof PARTICLE_SHAPES)[number]

export const WORD_FX_KINDS = [
  'domino',
  'rainbow-wave',
  'star-fly',
  'confetti-pop',
  'stamp',
  'bubble-up',
] as const
export type WordFxKind = (typeof WORD_FX_KINDS)[number]

export const LABEL_STYLES = ['bubble', 'ribbon', 'sticker', 'badge'] as const
export type LabelStyle = (typeof LABEL_STYLES)[number]

export const RUNNERS = ['kitten', 'dino', 'rocket', 'turtle', 'bunny'] as const
export type Runner = (typeof RUNNERS)[number]

export const ACCESSORIES = ['sunglasses', 'party-hat', 'crown', 'headphones', 'bowtie'] as const
export type Accessory = (typeof ACCESSORIES)[number]

export const SKY_VARIANTS = ['rainbow', 'shooting-stars', 'balloons'] as const
export type SkyVariant = (typeof SKY_VARIANTS)[number]

export const SUPER_VARIANTS = ['rainbow', 'gold', 'galaxy'] as const
export type SuperVariant = (typeof SUPER_VARIANTS)[number]

export const EVOLVE_VARIANTS = ['phoenix', 'star', 'hero'] as const
export type EvolveVariant = (typeof EVOLVE_VARIANTS)[number]

export const FIREWORK_KINDS = ['peony', 'heart', 'star', 'ring'] as const
export type FireworkKind = (typeof FIREWORK_KINDS)[number]

export const STICKERS = ['star', 'candy', 'heart', 'balloon', 'flower', 'moon', 'cloud'] as const
export type Sticker = (typeof STICKERS)[number]

const keys = (prefix: string, n: number) =>
  Array.from({ length: n }, (_, i) => `${prefix}${i + 1}` as TranslationKey)

export const PRAISE_KEYS: readonly TranslationKey[] = keys('fxPraise', 24)
export const OWL_PRAISE_KEYS: readonly TranslationKey[] = keys('fxOwlPraise', 20)
export const OWL_ENCOURAGE_KEYS: readonly TranslationKey[] = keys('fxOwlEncourage', 6)

export const POOL_WINDOW = {
  pop: 3,
  shape: 3,
  word: 3,
  label: 3,
  runner: 2,
  accessory: 2,
  sky: 1,
  super: 1,
  evolve: 1,
  fireworks: 1,
  sticker: 1,
  praise: 5,
  owlPraise: 5,
  encourage: 3,
} as const
