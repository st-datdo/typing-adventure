export type ModerationReason =
  | 'invalid_chars'
  | 'too_long'
  | 'mixed_script'
  | 'blocked'
  | 'duplicate'

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

const LATIN_LETTER = /(?=\p{L})\p{Script=Latin}/u
const OTHER_SCRIPT_LETTER = /(?=\p{L})[\p{Script=Cyrillic}\p{Script=Greek}]/u

const SKELETON: Readonly<Record<string, string>> = {
  а: 'a',
  в: 'b',
  с: 'c',
  ԁ: 'd',
  е: 'e',
  һ: 'h',
  н: 'h',
  і: 'i',
  ј: 'j',
  к: 'k',
  м: 'm',
  о: 'o',
  р: 'p',
  ѕ: 's',
  т: 't',
  у: 'y',
  х: 'x',
  α: 'a',
  β: 'b',
  γ: 'y',
  ι: 'i',
  κ: 'k',
  ν: 'v',
  ο: 'o',
  ρ: 'p',
  τ: 't',
  υ: 'u',
  χ: 'x',
  ı: 'i',
}

function skeleton(word: string): string {
  return Array.from(word, (char) => SKELETON[char] ?? char).join('')
}

function fold(word: string): string {
  return skeleton(word.replace(/[đĐ]/g, 'd').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase())
}

function tokenize(word: string): string[] {
  return fold(word)
    .split(/[\s'-]+/)
    .filter((token) => token !== '')
}

function isMixedScript(word: string): boolean {
  return LATIN_LETTER.test(word) && OTHER_SCRIPT_LETTER.test(word)
}

function containsSequence(tokens: readonly string[], entry: readonly string[]): boolean {
  for (let start = 0; start + entry.length <= tokens.length; start++) {
    if (entry.every((token, offset) => tokens[start + offset] === token)) return true
  }
  return false
}

function isBlocked(word: string, blocklist: readonly string[][]): boolean {
  const tokens = tokenize(word)
  return blocklist.some((entry) => containsSequence(tokens, entry))
}

export function moderateWords(
  words: readonly string[],
  blocklist: readonly string[] = DEFAULT_BLOCKLIST,
): ModerationResult {
  const blocked = blocklist
    .map((entry) => tokenize(normalizeWord(entry)))
    .filter((tokens) => tokens.length > 0)
  const seen = new Set<string>()
  const accepted: string[] = []
  const rejected: ModerationRejection[] = []

  for (const raw of words) {
    const word = normalizeWord(raw)
    let reason: ModerationReason | null = null
    if (!ALLOWED_WORD.test(word)) reason = 'invalid_chars'
    else if ([...word].length > MAX_WORD_LENGTH) reason = 'too_long'
    else if (isMixedScript(word)) reason = 'mixed_script'
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
