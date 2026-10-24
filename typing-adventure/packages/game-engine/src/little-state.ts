import type { DailyPlay, LetterProgress, LittleItem, LittleSession, Sticker } from './types'
import {
  STICKERS,
  PRAISE_COUNT,
  HINT_LEVEL_1_MS,
  HINT_LEVEL_2_MS,
  MIN_DAILY_LIMIT,
  MAX_DAILY_LIMIT,
} from './little-content'

export type LittleOutcome = 'ignored' | 'wrong' | 'char' | 'item' | 'stage' | 'session'

export interface LittleState {
  session: LittleSession
  stageIndex: number
  itemIndex: number
  charIndex: number
  charHadMistake: boolean
  progress: LetterProgress
  foundCount: number
  finished: boolean
}

export function createLittleState(session: LittleSession, progress: LetterProgress): LittleState {
  return {
    session,
    stageIndex: 0,
    itemIndex: 0,
    charIndex: 0,
    charHadMistake: false,
    progress,
    foundCount: 0,
    finished: session.stages.every(s => s.length === 0),
  }
}

export function getCurrentItem(state: LittleState): LittleItem | null {
  if (state.finished) return null
  return state.session.stages[state.stageIndex]?.[state.itemIndex] ?? null
}

export function getExpectedChar(state: LittleState): string | null {
  return getCurrentItem(state)?.target[state.charIndex] ?? null
}

export function littleKeypress(state: LittleState, char: string): { state: LittleState; outcome: LittleOutcome } {
  const ch = char.toLowerCase()
  const expected = getExpectedChar(state)
  if (!/^[a-z]$/.test(ch) || expected === null) return { state, outcome: 'ignored' }

  if (ch !== expected) {
    return { state: { ...state, charHadMistake: true }, outcome: 'wrong' }
  }

  const prev = state.progress[ch] ?? { seen: 0, firstTry: 0 }
  const progress = {
    ...state.progress,
    [ch]: { seen: prev.seen + 1, firstTry: prev.firstTry + (state.charHadMistake ? 0 : 1) },
  }
  const base = { ...state, progress, foundCount: state.foundCount + 1, charHadMistake: false }

  const item = getCurrentItem(state)!
  if (state.charIndex + 1 < item.target.length) {
    return { state: { ...base, charIndex: state.charIndex + 1 }, outcome: 'char' }
  }

  const stage = state.session.stages[state.stageIndex]
  if (state.itemIndex + 1 < stage.length) {
    return { state: { ...base, itemIndex: state.itemIndex + 1, charIndex: 0 }, outcome: 'item' }
  }

  if (state.stageIndex + 1 < state.session.stages.length) {
    return { state: { ...base, stageIndex: state.stageIndex + 1, itemIndex: 0, charIndex: 0 }, outcome: 'stage' }
  }

  return { state: { ...base, finished: true }, outcome: 'session' }
}

export function getHintLevel(idleMs: number): 0 | 1 | 2 {
  if (idleMs >= HINT_LEVEL_2_MS) return 2
  if (idleMs >= HINT_LEVEL_1_MS) return 1
  return 0
}

function forToday(daily: DailyPlay, today: string): DailyPlay {
  return daily.date === today ? daily : { date: today, sessions: 0, bonus: 0 }
}

export function sessionsLeftToday(daily: DailyPlay, today: string, limit: number): number {
  const d = forToday(daily, today)
  return Math.max(0, limit + d.bonus - d.sessions)
}

export function canStartLittleSession(daily: DailyPlay, today: string, limit: number): boolean {
  return sessionsLeftToday(daily, today, limit) > 0
}

export function markLittleSessionStarted(daily: DailyPlay, today: string): DailyPlay {
  const d = forToday(daily, today)
  return { ...d, sessions: d.sessions + 1 }
}

export function grantBonusSession(daily: DailyPlay, today: string): DailyPlay {
  const d = forToday(daily, today)
  return { ...d, bonus: d.bonus + 1 }
}

export function clampDailyLimit(n: number): number {
  return Math.min(MAX_DAILY_LIMIT, Math.max(MIN_DAILY_LIMIT, Math.round(n)))
}

export function nextSticker(collectedCount: number): Sticker {
  return STICKERS[collectedCount % STICKERS.length]
}

export function pickPraiseIndex(last: number | null, rng: () => number): number {
  const r = Math.min(Math.max(rng(), 0), 0.999999)
  if (last === null || last < 0 || last >= PRAISE_COUNT) return Math.floor(r * PRAISE_COUNT)
  const idx = Math.floor(r * (PRAISE_COUNT - 1))
  return idx >= last ? idx + 1 : idx
}
