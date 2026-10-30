import { MAX_WPM } from '@typing-adventure/game-engine'

const MIN_KEYSTROKE_INTERVAL_MS = 20

interface ProgressCheck {
  lastIndex: number
  lastTimestamp: number
  keystrokeTimestamps: number[]
  flagCount: number
}

const playerChecks = new Map<string, ProgressCheck>()

export function initPlayerCheck(userId: string): void {
  playerChecks.set(userId, {
    lastIndex: 0,
    lastTimestamp: Date.now(),
    keystrokeTimestamps: [],
    flagCount: 0,
  })
}

export function removePlayerCheck(userId: string): void {
  playerChecks.delete(userId)
}

export interface CheatResult {
  valid: boolean
  reason?: string
  shouldKick: boolean
}

export function validateProgress(
  userId: string,
  currentIndex: number,
  wpm: number,
  textLength: number,
): CheatResult {
  const check = playerChecks.get(userId)
  if (!check) return { valid: true, shouldKick: false }

  const now = Date.now()

  // 1. Index must only increase and not jump too far
  if (currentIndex < check.lastIndex) {
    check.flagCount++
    return flagOrKick(check, 'Index decreased')
  }

  const indexJump = currentIndex - check.lastIndex
  const timeDiffMs = now - check.lastTimestamp

  // Allow jumps up to 5 chars at a time (batch update)
  if (indexJump > 5 && timeDiffMs < 100) {
    check.flagCount++
    return flagOrKick(check, 'Index jumped too fast')
  }

  // 2. WPM cap
  if (wpm > MAX_WPM) {
    check.flagCount++
    return flagOrKick(check, `WPM too high: ${wpm}`)
  }

  // 3. Keystroke timing
  if (indexJump > 0 && timeDiffMs > 0) {
    const avgIntervalMs = timeDiffMs / indexJump
    if (avgIntervalMs < MIN_KEYSTROKE_INTERVAL_MS && indexJump > 2) {
      check.flagCount++
      return flagOrKick(check, `Keystroke interval too fast: ${avgIntervalMs.toFixed(0)}ms`)
    }
  }

  // 4. Index must not exceed text length
  if (currentIndex > textLength) {
    check.flagCount++
    return flagOrKick(check, 'Index exceeds text length')
  }

  // Update state
  check.lastIndex = currentIndex
  check.lastTimestamp = now

  return { valid: true, shouldKick: false }
}

function flagOrKick(check: ProgressCheck, reason: string): CheatResult {
  if (check.flagCount >= 3) {
    return { valid: false, reason, shouldKick: true }
  }
  return { valid: false, reason, shouldKick: false }
}

export function clearAllChecks(): void {
  playerChecks.clear()
}
