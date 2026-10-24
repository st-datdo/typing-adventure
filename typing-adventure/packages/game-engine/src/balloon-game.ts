export interface Balloon {
  id: number
  letter: string
  x: number
  y: number
  speed: number
  color: number
}

export interface BalloonGameState {
  letters: string[]
  target: number
  balloons: Balloon[]
  popped: number
  escaped: number
  nextId: number
  spawnInMs: number
  elapsedMs: number
  finished: boolean
}

export const BALLOON_TARGET = 20
export const BALLOON_COLORS = 6
export const BALLOON_SPAWN_MS = 1400
export const BALLOON_BASE_SPEED = 0.08
export const BALLOON_SPEED_STEP = 0.004
export const BALLOON_MIN_ON_SCREEN = 3
export const BALLOON_MAX_ON_SCREEN = 5
const X_MIN = 0.08
const X_MAX = 0.92
const MIN_GAP_X = 0.14
const SPAWN_TRIES = 6

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('')

export function createBalloonGame(letters: string[] = ALPHABET, target = BALLOON_TARGET): BalloonGameState {
  return {
    letters: letters.length > 0 ? letters : ALPHABET,
    target,
    balloons: [],
    popped: 0,
    escaped: 0,
    nextId: 1,
    spawnInMs: 0,
    elapsedMs: 0,
    finished: target <= 0,
  }
}

export function balloonCapacity(popped: number): number {
  return Math.min(BALLOON_MAX_ON_SCREEN, BALLOON_MIN_ON_SCREEN + Math.floor(popped / 6))
}

export function balloonSpeed(popped: number): number {
  return BALLOON_BASE_SPEED + BALLOON_SPEED_STEP * popped
}

function pick<T>(items: T[], rng: () => number): T {
  return items[Math.min(items.length - 1, Math.floor(rng() * items.length))]
}

function spawn(state: BalloonGameState, rng: () => number): Balloon {
  const onScreen = new Set(state.balloons.map(b => b.letter))
  const fresh = state.letters.filter(l => !onScreen.has(l))
  const letter = pick(fresh.length > 0 ? fresh : state.letters, rng)
  let x = X_MIN + rng() * (X_MAX - X_MIN)
  for (let i = 0; i < SPAWN_TRIES && state.balloons.some(b => b.y < 0.3 && Math.abs(b.x - x) < MIN_GAP_X); i++) {
    x = X_MIN + rng() * (X_MAX - X_MIN)
  }
  return {
    id: state.nextId,
    letter,
    x,
    y: 0,
    speed: balloonSpeed(state.popped),
    color: state.nextId % BALLOON_COLORS,
  }
}

export function tickBalloons(state: BalloonGameState, dtMs: number, rng: () => number): BalloonGameState {
  if (state.finished || dtMs <= 0) return state
  const dt = dtMs / 1000
  const moved = state.balloons.map(b => ({ ...b, y: b.y + b.speed * dt }))
  const kept = moved.filter(b => b.y < 1)
  let next: BalloonGameState = {
    ...state,
    balloons: kept,
    escaped: state.escaped + (moved.length - kept.length),
    elapsedMs: state.elapsedMs + dtMs,
    spawnInMs: state.spawnInMs - dtMs,
  }
  if (next.spawnInMs <= 0 && next.balloons.length < balloonCapacity(next.popped)) {
    const balloon = spawn(next, rng)
    next = {
      ...next,
      balloons: [...next.balloons, balloon],
      nextId: next.nextId + 1,
      spawnInMs: BALLOON_SPAWN_MS,
    }
  }
  return next
}

export function popBalloon(state: BalloonGameState, char: string): { state: BalloonGameState; popped: Balloon | null } {
  const ch = char.toLowerCase()
  if (state.finished || !/^[a-z]$/.test(ch)) return { state, popped: null }
  let best: Balloon | null = null
  for (const b of state.balloons) {
    if (b.letter === ch && (best === null || b.y > best.y)) best = b
  }
  if (!best) return { state, popped: null }
  const popped = state.popped + 1
  const target = best
  return {
    state: {
      ...state,
      balloons: state.balloons.filter(b => b.id !== target.id),
      popped,
      finished: popped >= state.target,
      spawnInMs: Math.min(state.spawnInMs, BALLOON_SPAWN_MS / 2),
    },
    popped: target,
  }
}

export function balloonStars(escaped: number): 1 | 2 | 3 {
  if (escaped <= 2) return 3
  if (escaped <= 6) return 2
  return 1
}
