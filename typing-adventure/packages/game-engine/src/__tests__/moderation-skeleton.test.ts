import { describe, expect, it } from 'vitest'
import { moderateWords } from '../index'

const reasons = (words: string[], blocklist?: string[]) =>
  moderateWords(words, blocklist).rejected.map((r) => [r.word, r.reason])

describe('moderateWords skeleton', () => {
  it('WX-01: uppercase Cyrillic folds to Latin after lowercase', () => {
    expect(reasons(['СТ'], ['ct'])).toEqual([['СТ', 'blocked']])
  })

  it('WX-01: accented Greek folds to Latin after removing marks', () => {
    expect(reasons(['ύ'], ['u'])).toEqual([['ύ', 'blocked']])
  })

  it('WX-01: every Cyrillic entry of the table maps to its Latin letter', () => {
    expect(reasons(['авсԁеһнікмортѕухј'], ['abcdehhikmoptsyxj'])).toEqual([
      ['авсԁеһнікмортѕухј', 'blocked'],
    ])
  })

  it('WX-01: every Greek entry of the table maps to its Latin letter', () => {
    expect(reasons(['αβγικνορτυχ'], ['abyikvoptux'])).toEqual([['αβγικνορτυχ', 'blocked']])
  })

  it('WX-01: blocklist entries are folded with the skeleton too', () => {
    expect(reasons(['cat'], ['сат'])).toEqual([['cat', 'blocked']])
  })

  it('WX-01: characters outside the table are kept', () => {
    expect(moderateWords(['шит', 'пес'], ['wit', 'nec']).accepted).toEqual(['шит', 'пес'])
    expect(reasons(['пес'], ['пеc'])).toEqual([['пес', 'blocked']])
  })

  it('WX-02: all-Cyrillic lookalike of a blocklist entry is blocked', () => {
    expect(reasons(['сат', 'САТ'], ['cat'])).toEqual([
      ['сат', 'blocked'],
      ['САТ', 'blocked'],
    ])
  })

  it('WX-02: Cyrillic plus Greek lookalike is blocked by the default blocklist', () => {
    expect(reasons(['ѕтυріԁ'])).toEqual([['ѕтυріԁ', 'blocked']])
    expect(moderateWords(['ѕтυріԁ']).accepted).toEqual([])
  })

  it('WX-03: dotless i folds to i before the blocklist check', () => {
    expect(reasons(['stupıd', 'ıdıot', 'you stupıd'])).toEqual([
      ['stupıd', 'blocked'],
      ['ıdıot', 'blocked'],
      ['you stupıd', 'blocked'],
    ])
  })

  it('WX-04: Cyrillic and Greek words that match nothing after skeleton are accepted', () => {
    const words = ['привет', 'мама', 'αβγ', 'сат']
    expect(moderateWords(words).accepted).toEqual(words)
    expect(moderateWords(words).rejected).toEqual([])
  })

  it('WX-05: duplicate compares lowercase words without skeleton', () => {
    const result = moderateWords(['cat', 'сат'], [])
    expect(result.accepted).toEqual(['cat', 'сат'])
    expect(result.rejected).toEqual([])
  })
})
