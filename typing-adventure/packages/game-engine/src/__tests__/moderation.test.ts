import { describe, expect, it } from 'vitest'
import { DEFAULT_BLOCKLIST, MAX_WORD_LENGTH, moderateWords } from '../index'

const reasons = (words: string[], blocklist?: string[]) =>
  moderateWords(words, blocklist).rejected.map((r) => [r.word, r.reason])

describe('moderateWords', () => {
  it('WP-01: trims, collapses inner whitespace and keeps input order', () => {
    const result = moderateWords(['  cat ', 'ice   cream', 'dog\tbone', 'sun'], [])
    expect(result.accepted).toEqual(['cat', 'ice cream', 'dog bone', 'sun'])
    expect(result.rejected).toEqual([])
  })

  it('WP-01: normalizes to NFC so decomposed Vietnamese equals composed', () => {
    const decomposed = 'Việt'
    const result = moderateWords([decomposed], [])
    expect(result.accepted).toEqual(['Việt'])
    expect(result.accepted[0]).toHaveLength(4)
  })

  it('WP-01: rejected entries carry the normalized word', () => {
    expect(reasons(['  bad   word  '], ['bad'])).toEqual([['bad word', 'blocked']])
  })

  it('WP-02: empty and whitespace-only words are invalid_chars', () => {
    expect(reasons(['', '   '], [])).toEqual([
      ['', 'invalid_chars'],
      ['', 'invalid_chars'],
    ])
  })

  it('WP-02: digits, punctuation and emoji are invalid_chars', () => {
    expect(reasons(['abc1', 'hi!', 'a_b', 'cat🐱', '<b>'], [])).toEqual([
      ['abc1', 'invalid_chars'],
      ['hi!', 'invalid_chars'],
      ['a_b', 'invalid_chars'],
      ['cat🐱', 'invalid_chars'],
      ['<b>', 'invalid_chars'],
    ])
  })

  it('WP-02: letters with diacritics, apostrophe and hyphen are accepted', () => {
    const words = ['đường', 'Tiếng Việt', "don't", 'ice-cream', 'naïve']
    expect(moderateWords(words, []).accepted).toEqual(words)
  })

  it('WP-02: longer than MAX_WORD_LENGTH code points is too_long', () => {
    expect(MAX_WORD_LENGTH).toBe(30)
    const ok = 'a'.repeat(30)
    const long = 'a'.repeat(31)
    const result = moderateWords([ok, long], [])
    expect(result.accepted).toEqual([ok])
    expect(result.rejected).toEqual([{ word: long, reason: 'too_long' }])
  })

  it('WP-02: length is counted after NFC', () => {
    const word = 'ê'.repeat(30)
    expect(moderateWords([word], []).accepted).toEqual(['ê'.repeat(30)])
  })

  it('WP-02: invalid_chars wins over too_long', () => {
    expect(reasons(['1'.repeat(40)], [])).toEqual([['1'.repeat(40), 'invalid_chars']])
  })

  it('WP-03: blocklist match ignores case and Vietnamese diacritics', () => {
    expect(reasons(['NGU', 'Ngủ', 'ngũ'], ['ngu'])).toEqual([
      ['NGU', 'blocked'],
      ['Ngủ', 'blocked'],
      ['ngũ', 'blocked'],
    ])
  })

  it('WP-03: đ and Đ fold to d on both sides', () => {
    expect(reasons(['Dần', 'DAN', 'đần', 'Đần'], ['đần'])).toEqual([
      ['Dần', 'blocked'],
      ['DAN', 'blocked'],
      ['đần', 'blocked'],
      ['Đần', 'blocked'],
    ])
    expect(reasons(['dog'], ['Đog'])).toEqual([['dog', 'blocked']])
  })

  it('WP-03: matches a whole token but not a substring', () => {
    const result = moderateWords(
      ['nguyen', 'Nguyễn', 'đồ ngu', 'bad apple', 'badminton'],
      ['ngu', 'bad'],
    )
    expect(result.accepted).toEqual(['nguyen', 'Nguyễn', 'badminton'])
    expect(result.rejected).toEqual([
      { word: 'đồ ngu', reason: 'blocked' },
      { word: 'bad apple', reason: 'blocked' },
    ])
  })

  it('WP-03: a multi-word blocklist entry matches the whole word', () => {
    expect(reasons(['Đồ  Ngốc', 'ngốc'], ['đồ ngốc'])).toEqual([['Đồ Ngốc', 'blocked']])
  })

  it('WP-03: too_long wins over blocked', () => {
    const long = `ngu ${'a'.repeat(30)}`
    expect(reasons([long], ['ngu'])).toEqual([[long, 'too_long']])
  })

  it('WP-03: the default blocklist has at least 3 entries and is used by default', () => {
    expect(DEFAULT_BLOCKLIST.length).toBeGreaterThanOrEqual(3)
    const first = DEFAULT_BLOCKLIST[0]
    expect(moderateWords([first.toUpperCase(), 'cat']).rejected).toEqual([
      { word: first.toUpperCase(), reason: 'blocked' },
    ])
  })

  it('WP-04: duplicates ignore case and spacing, keep the first occurrence', () => {
    const result = moderateWords(['Cat', 'cat', ' CAT ', 'dog'], [])
    expect(result.accepted).toEqual(['Cat', 'dog'])
    expect(result.rejected).toEqual([
      { word: 'cat', reason: 'duplicate' },
      { word: 'CAT', reason: 'duplicate' },
    ])
  })

  it('WP-04: diacritics make different words', () => {
    expect(moderateWords(['ma', 'mà', 'má', 'ma'], []).accepted).toEqual(['ma', 'mà', 'má'])
  })

  it('WP-04: blocked wins over duplicate and a rejected word does not count as seen', () => {
    expect(reasons(['ngu', 'ngu'], ['ngu'])).toEqual([
      ['ngu', 'blocked'],
      ['ngu', 'blocked'],
    ])
    expect(reasons(['a1', 'a1'], [])).toEqual([
      ['a1', 'invalid_chars'],
      ['a1', 'invalid_chars'],
    ])
  })
})
