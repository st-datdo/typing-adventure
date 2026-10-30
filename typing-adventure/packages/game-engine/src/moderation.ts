export type ModerationReason = 'invalid_chars' | 'too_long' | 'blocked' | 'duplicate'

export interface ModerationRejection {
  word: string
  reason: ModerationReason
}

export interface ModerationResult {
  accepted: string[]
  rejected: ModerationRejection[]
}

export const MAX_WORD_LENGTH = 30

export const DEFAULT_BLOCKLIST: readonly string[] = ['stupid', 'idiot', 'dumb', 'đồ ngốc']

const ALLOWED_WORD = /^[\p{L}\p{M}' -]+$/u

function normalizeWord(word: string): string {
  return word.normalize('NFC').trim().replace(/\s+/g, ' ')
}

function fold(word: string): string {
  return word.replace(/[đĐ]/g, 'd').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function isBlocked(word: string, blocked: Set<string>): boolean {
  const folded = fold(word)
  if (blocked.has(folded)) return true
  return folded.split(' ').some((token) => blocked.has(token))
}

export function moderateWords(
  words: readonly string[],
  blocklist: readonly string[] = DEFAULT_BLOCKLIST,
): ModerationResult {
  const blocked = new Set(blocklist.map((entry) => fold(normalizeWord(entry))))
  const seen = new Set<string>()
  const accepted: string[] = []
  const rejected: ModerationRejection[] = []

  for (const raw of words) {
    const word = normalizeWord(raw)
    let reason: ModerationReason | null = null
    if (!ALLOWED_WORD.test(word)) reason = 'invalid_chars'
    else if ([...word].length > MAX_WORD_LENGTH) reason = 'too_long'
    else if (isBlocked(word, blocked)) reason = 'blocked'
    else if (seen.has(word.toLowerCase())) reason = 'duplicate'

    if (reason) {
      rejected.push({ word, reason })
    } else {
      seen.add(word.toLowerCase())
      accepted.push(word)
    }
  }

  return { accepted, rejected }
}
