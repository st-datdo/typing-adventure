import type {
  ChildProgress,
  DailyPlay,
  GamesSaved,
  LetterProgress,
  LittleSaved,
  MiniGameId,
  PetState,
} from './types'
import { DEFAULT_DAILY_LIMIT, LETTER_ORDER } from './little-content'
import { clampDailyLimit } from './little-state'
import { EMPTY_PET, PET_KINDS } from './pet'

const MAX_COUNT = 1_000_000
const MAX_STICKERS = 2000
const MAX_STICKER_LENGTH = 16
const MINI_GAMES: MiniGameId[] = ['balloon', 'picture']
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function emptyChildProgress(): ChildProgress {
  return {
    little: {
      progress: {},
      stickers: [],
      daily: { date: '', sessions: 0, bonus: 0 },
      dailyLimit: DEFAULT_DAILY_LIMIT,
      pet: EMPTY_PET,
    },
    games: { best: {}, plays: {} },
    updatedAt: 0,
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function count(v: unknown): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return 0
  return Math.min(MAX_COUNT, Math.max(0, Math.floor(v)))
}

function day(v: unknown): string {
  return typeof v === 'string' && DAY_PATTERN.test(v) ? v : ''
}

function normalizeProgress(v: unknown): LetterProgress {
  if (!isRecord(v)) return {}
  const out: LetterProgress = {}
  for (const letter of LETTER_ORDER) {
    const entry = v[letter]
    if (!isRecord(entry)) continue
    const seen = count(entry.seen)
    const firstTry = Math.min(count(entry.firstTry), seen)
    if (seen > 0) out[letter] = { seen, firstTry }
  }
  return out
}

function normalizeDaily(v: unknown): DailyPlay {
  if (!isRecord(v)) return { date: '', sessions: 0, bonus: 0 }
  return { date: day(v.date), sessions: count(v.sessions), bonus: count(v.bonus) }
}

function normalizePet(v: unknown): PetState {
  if (!isRecord(v)) return EMPTY_PET
  const kind = PET_KINDS.find(k => k === v.kind) ?? null
  if (kind === null) return EMPTY_PET
  return { kind, days: count(v.days), lastDay: day(v.lastDay) }
}

function normalizeGameMap(v: unknown): Partial<Record<MiniGameId, number>> {
  if (!isRecord(v)) return {}
  const out: Partial<Record<MiniGameId, number>> = {}
  for (const id of MINI_GAMES) {
    const n = count(v[id])
    if (n > 0) out[id] = n
  }
  return out
}

export function normalizeChildProgress(raw: unknown): ChildProgress {
  const base = emptyChildProgress()
  if (!isRecord(raw)) return base
  const little = isRecord(raw.little) ? raw.little : {}
  const games = isRecord(raw.games) ? raw.games : {}
  const stickers = Array.isArray(little.stickers)
    ? little.stickers
      .filter((s): s is string => typeof s === 'string' && s.length > 0 && s.length <= MAX_STICKER_LENGTH)
      .slice(0, MAX_STICKERS)
    : []
  return {
    little: {
      progress: normalizeProgress(little.progress),
      stickers,
      daily: normalizeDaily(little.daily),
      dailyLimit: typeof little.dailyLimit === 'number' && Number.isFinite(little.dailyLimit)
        ? clampDailyLimit(little.dailyLimit)
        : DEFAULT_DAILY_LIMIT,
      pet: normalizePet(little.pet),
    },
    games: { best: normalizeGameMap(games.best), plays: normalizeGameMap(games.plays) },
    updatedAt: typeof raw.updatedAt === 'number' && Number.isFinite(raw.updatedAt) ? Math.max(0, raw.updatedAt) : 0,
  }
}

function mergeProgress(a: LetterProgress, b: LetterProgress): LetterProgress {
  const out: LetterProgress = {}
  for (const letter of LETTER_ORDER) {
    const x = a[letter]
    const y = b[letter]
    if (!x && !y) continue
    out[letter] = {
      seen: Math.max(x?.seen ?? 0, y?.seen ?? 0),
      firstTry: Math.max(x?.firstTry ?? 0, y?.firstTry ?? 0),
    }
  }
  return out
}

function mergeDaily(a: DailyPlay, b: DailyPlay): DailyPlay {
  if (a.date === b.date) {
    return { date: a.date, sessions: Math.max(a.sessions, b.sessions), bonus: Math.max(a.bonus, b.bonus) }
  }
  return a.date > b.date ? a : b
}

function mergePet(a: PetState, b: PetState, aNewer: boolean): PetState {
  if (a.kind === null) return b
  if (b.kind === null) return a
  if (a.kind === b.kind) {
    return { kind: a.kind, days: Math.max(a.days, b.days), lastDay: a.lastDay > b.lastDay ? a.lastDay : b.lastDay }
  }
  if (a.days !== b.days) return a.days > b.days ? a : b
  return aNewer ? a : b
}

function mergeGameMap(
  a: Partial<Record<MiniGameId, number>>,
  b: Partial<Record<MiniGameId, number>>,
): Partial<Record<MiniGameId, number>> {
  const out: Partial<Record<MiniGameId, number>> = {}
  for (const id of MINI_GAMES) {
    const n = Math.max(a[id] ?? 0, b[id] ?? 0)
    if (n > 0) out[id] = n
  }
  return out
}

function mergeLittle(a: LittleSaved, b: LittleSaved, aNewer: boolean): LittleSaved {
  return {
    progress: mergeProgress(a.progress, b.progress),
    stickers: a.stickers.length >= b.stickers.length ? a.stickers : b.stickers,
    daily: mergeDaily(a.daily, b.daily),
    dailyLimit: aNewer ? a.dailyLimit : b.dailyLimit,
    pet: mergePet(a.pet, b.pet, aNewer),
  }
}

function mergeGames(a: GamesSaved, b: GamesSaved): GamesSaved {
  return { best: mergeGameMap(a.best, b.best), plays: mergeGameMap(a.plays, b.plays) }
}

export function mergeChildProgress(a: ChildProgress, b: ChildProgress): ChildProgress {
  const aNewer = a.updatedAt >= b.updatedAt
  return {
    little: mergeLittle(a.little, b.little, aNewer),
    games: mergeGames(a.games, b.games),
    updatedAt: Math.max(a.updatedAt, b.updatedAt),
  }
}

function sortedJson(v: unknown): string {
  return JSON.stringify(v, (_key, value: unknown) => {
    if (!isRecord(value)) return value
    return Object.fromEntries(Object.keys(value).sort().map(k => [k, value[k]]))
  })
}

export function sameChildProgress(a: ChildProgress, b: ChildProgress): boolean {
  return sortedJson({ ...a, updatedAt: 0 }) === sortedJson({ ...b, updatedAt: 0 })
}
