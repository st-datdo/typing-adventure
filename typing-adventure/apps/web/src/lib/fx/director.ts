import type { TranslationKey } from '@typing-adventure/i18n'
import { canvasBurstPlan, flashGate, type CanvasBurst } from './budget'
import { levelAllows, type EffectsLevel } from './levels'
import { mergeOwlMood, type FxOwlMood } from './owl'
import { pickNonRepeating } from './pick'
import {
  ACCESSORIES,
  EVOLVE_VARIANTS,
  FIREWORK_KINDS,
  LABEL_STYLES,
  OWL_ENCOURAGE_KEYS,
  OWL_PRAISE_KEYS,
  PARTICLE_SHAPES,
  POOL_WINDOW,
  POP_KINDS,
  PRAISE_KEYS,
  RUNNERS,
  SKY_VARIANTS,
  STICKERS,
  SUPER_VARIANTS,
  WORD_FX_KINDS,
  type Accessory,
  type EvolveVariant,
  type FireworkKind,
  type LabelStyle,
  type ParticleShape,
  type PopKind,
  type Runner,
  type SkyVariant,
  type Sticker,
  type SuperVariant,
  type WordFxKind,
} from './pools'
import { jitter, randInt, type Rng } from './rng'
import { materialsFor, tierOf } from './tiers'

export type LabelBand = 'play' | 'fun' | 'primary' | 'rainbow'

export interface FxState {
  seq: number
  level: EffectsLevel
  suppressed: boolean
  combo: number
  misses: number
  flash: number[]
  history: Record<string, unknown[]>
  pop: { id: number; index: number; kind: PopKind; amp: number } | null
  sparks: { id: number; index: number; count: number; shapes: ParticleShape[]; seed: number } | null
  word: { id: number; kind: WordFxKind; range: [number, number]; tilt: number } | null
  label: {
    id: number
    tier: number
    praise: TranslationKey
    style: LabelStyle
    band: LabelBand
    animate: boolean
    tilt: number
    rise: number
  } | null
  confetti: { id: number; index: number; bursts: CanvasBurst[] } | null
  runner: { id: number; character: Runner; direction: 1 | -1 } | null
  rain: { id: number; stickers: Sticker[]; count: number; seed: number } | null
  fireworks: { id: number; kind: FireworkKind; bursts: CanvasBurst[] } | null
  evolve: { id: number; variant: EvolveVariant } | null
  bubble: { id: number; kind: 'praise' | 'encourage'; text: TranslationKey } | null
  owl: { id: number; mood: FxOwlMood; ttl: number | null }
  sky: SkyVariant | null
  accessory: Accessory | null
  superMode: SuperVariant | null
  meter: { smokeId: number }
}

export type FxSlot =
  | 'pop'
  | 'sparks'
  | 'word'
  | 'label'
  | 'confetti'
  | 'runner'
  | 'rain'
  | 'fireworks'
  | 'evolve'
  | 'bubble'
  | 'owl'

export type FxEvent =
  | {
      type: 'key'
      correct: boolean
      combo: number
      index: number
      char: string
      word: [number, number] | null
      now: number
    }
  | { type: 'expire'; slot: FxSlot; id: number }
  | { type: 'idle'; mood: 'wave' | 'sleep' }
  | { type: 'level'; value: EffectsLevel }
  | { type: 'suppress'; value: boolean }
  | { type: 'reset' }

export const FX_TTL = {
  label: 900,
  labelStatic: 800,
  pop: 400,
  sparks: 600,
  word: 700,
  confetti: 1000,
  runner: 2200,
  rain: 2200,
  fireworks: 2500,
  evolve: 1600,
  bubble: 1400,
  owlCheer: 1200,
  owlThinking: 800,
  owlHappy: 1000,
  owlWake: 800,
  owlEncourage: 1400,
} as const

export const FX_SLOTS: readonly FxSlot[] = [
  'pop',
  'sparks',
  'word',
  'label',
  'confetti',
  'runner',
  'rain',
  'fireworks',
  'evolve',
  'bubble',
  'owl',
]

export const INITIAL_FX: FxState = {
  seq: 0,
  level: 'lots',
  suppressed: false,
  combo: 0,
  misses: 0,
  flash: [],
  history: {},
  pop: null,
  sparks: null,
  word: null,
  label: null,
  confetti: null,
  runner: null,
  rain: null,
  fireworks: null,
  evolve: null,
  bubble: null,
  owl: { id: 0, mood: 'idle', ttl: null },
  sky: null,
  accessory: null,
  superMode: null,
  meter: { smokeId: 0 },
}

export function slotTtl(state: FxState, slot: FxSlot): number | null {
  if (slot === 'owl') return state.owl.ttl
  if (slot === 'label') return state.label?.animate === false ? FX_TTL.labelStatic : FX_TTL.label
  return FX_TTL[slot]
}

function bandOf(tier: number): LabelBand {
  if (tier >= 75) return 'rainbow'
  if (tier >= 40) return 'primary'
  if (tier >= 15) return 'fun'
  return 'play'
}

type Draft = FxState

function pick<T>(d: Draft, name: keyof typeof POOL_WINDOW, pool: readonly T[], rng: Rng): T {
  const r = pickNonRepeating(pool, (d.history[name] ?? []) as T[], POOL_WINDOW[name], rng)
  d.history = { ...d.history, [name]: r.history }
  return r.item
}

function nextId(d: Draft): number {
  d.seq += 1
  return d.seq
}

function setOwl(d: Draft, mood: FxOwlMood, ttl: number | null) {
  const cur = d.owl.mood
  if (mergeOwlMood(cur, mood) !== mood) return
  d.owl = { id: nextId(d), mood, ttl }
}

function applyTier(d: Draft, tier: number, index: number, now: number, rng: Rng) {
  const mats = materialsFor(tier, d.level)
  if (!mats.includes('label')) return
  const gate = flashGate(d.flash, now)
  d.flash = gate.times
  const animate = d.level !== 'few' && gate.ok
  d.label = {
    id: nextId(d),
    tier,
    praise: pick(d, 'praise', PRAISE_KEYS, rng),
    style: d.level === 'few' ? 'bubble' : pick(d, 'label', LABEL_STYLES, rng),
    band: bandOf(tier),
    animate,
    tilt: Math.round((rng() * 8 - 4) * 10) / 10,
    rise: Math.round(28 + rng() * 8),
  }
  d.bubble = null
  if (mats.includes('cheer')) setOwl(d, 'cheer', FX_TTL.owlCheer)
  if (mats.includes('confetti') && gate.ok) {
    d.confetti = { id: nextId(d), index, bursts: canvasBurstPlan('confetti', rng).bursts }
  }
  if (mats.includes('runner') && !d.runner) {
    d.runner = {
      id: nextId(d),
      character: pick(d, 'runner', RUNNERS, rng),
      direction: rng() < 0.5 ? 1 : -1,
    }
  }
  if (mats.includes('sky')) d.sky = pick(d, 'sky', SKY_VARIANTS, rng)
  if (mats.includes('accessory') && !d.accessory) {
    d.accessory = pick(d, 'accessory', ACCESSORIES, rng)
  }
  if (mats.includes('super')) d.superMode = pick(d, 'super', SUPER_VARIANTS, rng)
  if (mats.includes('rain') && gate.ok) {
    const stickers: Sticker[] = []
    while (stickers.length < 3) {
      const s = pick(d, 'sticker', STICKERS, rng)
      if (!stickers.includes(s)) stickers.push(s)
    }
    d.rain = {
      id: nextId(d),
      stickers,
      count: Math.round(jitter(18, rng, 0.2, 24)),
      seed: Math.floor(rng() * 1e9),
    }
  }
  if (mats.includes('evolve')) {
    d.evolve = { id: nextId(d), variant: pick(d, 'evolve', EVOLVE_VARIANTS, rng) }
    if (!d.accessory) d.accessory = pick(d, 'accessory', ACCESSORIES, rng)
  }
  if (mats.includes('fireworks') && gate.ok) {
    const kind = pick(d, 'fireworks', FIREWORK_KINDS, rng)
    d.fireworks = { id: nextId(d), kind, bursts: canvasBurstPlan(kind, rng).bursts }
  }
}

function onCorrect(d: Draft, e: Extract<FxEvent, { type: 'key' }>, rng: Rng) {
  d.misses = 0
  d.combo = e.combo
  if (d.owl.mood === 'sleep') d.owl = { id: nextId(d), mood: 'happy', ttl: FX_TTL.owlWake }
  else if (d.owl.mood === 'wave') d.owl = { id: nextId(d), mood: 'idle', ttl: null }
  if (d.suppressed) return
  if (levelAllows(d.level, 'pop')) {
    d.pop = {
      id: nextId(d),
      index: e.index,
      kind: pick(d, 'pop', POP_KINDS, rng),
      amp: Math.round(jitter(1, rng) * 100) / 100,
    }
  }
  if (levelAllows(d.level, 'sparks') && e.char !== ' ') {
    const n = randInt(1, 2, rng)
    const shapes: ParticleShape[] = []
    for (let i = 0; i < n; i++) shapes.push(pick(d, 'shape', PARTICLE_SHAPES, rng))
    d.sparks = {
      id: nextId(d),
      index: e.index,
      count: randInt(3, 5, rng),
      shapes,
      seed: Math.floor(rng() * 1e9),
    }
  }
  const tier = tierOf(e.combo)
  if (tier !== null) applyTier(d, tier, e.index, e.now, rng)
  if (e.word && e.char !== ' ' && levelAllows(d.level, 'word')) {
    d.word = {
      id: nextId(d),
      kind: pick(d, 'word', WORD_FX_KINDS, rng),
      range: e.word,
      tilt: Math.round((rng() * 24 - 12) * 10) / 10,
    }
    if (levelAllows(d.level, 'owlPraise') && d.label === null && rng() < 1 / 6) {
      d.bubble = {
        id: nextId(d),
        kind: 'praise',
        text: pick(d, 'owlPraise', OWL_PRAISE_KEYS, rng),
      }
      setOwl(d, 'happy', FX_TTL.owlHappy)
    }
  }
}

function onWrong(d: Draft, rng: Rng) {
  if (d.combo >= 3) d.meter = { smokeId: d.meter.smokeId + 1 }
  d.combo = 0
  d.misses += 1
  d.sky = null
  d.accessory = null
  d.superMode = null
  if (d.suppressed) return
  if (d.misses % 3 === 0) {
    setOwl(d, 'encourage', FX_TTL.owlEncourage)
    if (d.label === null) {
      d.bubble = {
        id: nextId(d),
        kind: 'encourage',
        text: pick(d, 'encourage', OWL_ENCOURAGE_KEYS, rng),
      }
    }
  } else {
    setOwl(d, 'thinking', FX_TTL.owlThinking)
  }
}

export function fxStep(state: FxState, event: FxEvent, rng: Rng): FxState {
  switch (event.type) {
    case 'key': {
      const d: Draft = { ...state }
      if (event.correct) onCorrect(d, event, rng)
      else onWrong(d, rng)
      return d
    }
    case 'expire': {
      if (event.slot === 'owl') {
        if (state.owl.id !== event.id || state.owl.mood === 'idle') return state
        return { ...state, owl: { id: state.owl.id, mood: 'idle', ttl: null } }
      }
      const cur = state[event.slot]
      if (!cur || cur.id !== event.id) return state
      return { ...state, [event.slot]: null }
    }
    case 'idle': {
      if (state.suppressed) return state
      if (mergeOwlMood(state.owl.mood, event.mood) !== event.mood) return state
      if (state.owl.mood === event.mood) return state
      return {
        ...state,
        seq: state.seq + 1,
        owl: { id: state.seq + 1, mood: event.mood, ttl: null },
      }
    }
    case 'level':
      return state.level === event.value ? state : { ...state, level: event.value }
    case 'suppress':
      return state.suppressed === event.value ? state : { ...state, suppressed: event.value }
    case 'reset':
      return {
        ...INITIAL_FX,
        seq: state.seq,
        history: state.history,
        level: state.level,
        suppressed: state.suppressed,
      }
  }
}
