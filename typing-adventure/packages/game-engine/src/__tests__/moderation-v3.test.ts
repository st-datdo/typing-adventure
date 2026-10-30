import { describe, expect, it } from 'vitest'
import { moderateWords } from '../index'

const reasons = (words: string[], blocklist?: string[]) =>
  moderateWords(words, blocklist).rejected.map((r) => [r.word, r.reason])

describe('moderateWords v3', () => {
  it('WM-01: tokens split on hyphen and apostrophe are blocked', () => {
    expect(
      reasons(
        ['dumb-dumb', "idiot's", '-stupid-', "bad'apple"],
        ['dumb', 'idiot', 'stupid', 'bad'],
      ),
    ).toEqual([
      ['dumb-dumb', 'blocked'],
      ["idiot's", 'blocked'],
      ['-stupid-', 'blocked'],
      ["bad'apple", 'blocked'],
    ])
  })

  it('WM-01: separators may repeat and mix with spaces', () => {
    expect(reasons(["good -' bad", 'x--bad'], ['bad'])).toEqual([
      ["good -' bad", 'blocked'],
      ['x--bad', 'blocked'],
    ])
  })

  it('WM-01: still no substring match inside a token', () => {
    const result = moderateWords(['dumbbell', 'nguyen-van', "badminton's"], ['dumb', 'ngu', 'bad'])
    expect(result.accepted).toEqual(['dumbbell', 'nguyen-van', "badminton's"])
    expect(result.rejected).toEqual([])
  })

  it('WM-02: a multi-token entry matches consecutive tokens anywhere', () => {
    expect(
      reasons(['thằng đồ ngốc', 'đồ-ngốc', "you're đồ ngốc nhé", 'đồ đồ ngốc'], ['đồ ngốc']),
    ).toEqual([
      ['thằng đồ ngốc', 'blocked'],
      ['đồ-ngốc', 'blocked'],
      ["you're đồ ngốc nhé", 'blocked'],
      ['đồ đồ ngốc', 'blocked'],
    ])
  })

  it('WM-02: tokens out of order or not adjacent are not blocked', () => {
    const result = moderateWords(['ngốc đồ', 'đồ chơi ngốc', 'đồ', 'ngốc'], ['đồ ngốc'])
    expect(result.accepted).toEqual(['ngốc đồ', 'đồ chơi ngốc', 'đồ', 'ngốc'])
  })

  it('WM-02: the entry is tokenized the same way as the word', () => {
    expect(reasons(['big bad wolf', 'big-bad', 'bad big'], ['big-bad'])).toEqual([
      ['big bad wolf', 'blocked'],
      ['big-bad', 'blocked'],
    ])
  })

  it('WM-02: an entry longer than the word does not match', () => {
    expect(moderateWords(['bad'], ['bad wolf']).accepted).toEqual(['bad'])
  })

  it('WM-03: combining marks outside U+0300-U+036F are removed when folding', () => {
    expect(reasons(['stup⃝id', 'stupid҉', 'idio҃t'], ['stupid', 'idiot'])).toEqual([
      ['stup⃝id', 'blocked'],
      ['stupid҉', 'blocked'],
      ['idio҃t', 'blocked'],
    ])
  })

  it('WM-03: marks in blocklist entries are removed too', () => {
    expect(reasons(['stupid'], ['stu⃝pid'])).toEqual([['stupid', 'blocked']])
  })

  it('WM-04: Latin mixed with Greek or Cyrillic is mixed_script', () => {
    expect(reasons(['stυpid', 'cаt', 'hello мир'], [])).toEqual([
      ['stυpid', 'mixed_script'],
      ['cаt', 'mixed_script'],
      ['hello мир', 'mixed_script'],
    ])
  })

  it('WM-04: single-script words are accepted', () => {
    const words = ['привет', 'αβγ', 'Việt', 'naïve']
    expect(moderateWords(words, []).accepted).toEqual(words)
  })

  it('WM-04: Cyrillic combining marks on Latin letters are not mixed_script', () => {
    const words = ['abc҃', 'cat҉']
    expect(moderateWords(words, []).accepted).toEqual(words)
  })

  it('WM-04: mixed_script comes after too_long and before blocked and duplicate', () => {
    const long = `cаt${'a'.repeat(30)}`
    expect(reasons([long, 'cаt1', 'stυpid', 'cаt', 'cаt'], ['stυpid'])).toEqual([
      [long, 'too_long'],
      ['cаt1', 'invalid_chars'],
      ['stυpid', 'mixed_script'],
      ['cаt', 'mixed_script'],
      ['cаt', 'mixed_script'],
    ])
  })

  it('WM-05: blocklist entries without tokens are ignored', () => {
    const result = moderateWords(['-', "'", 'cat', "- '"], ['', ' - ', "'", "-'-"])
    expect(result.accepted).toEqual(['-', "'", 'cat', "- '"])
    expect(result.rejected).toEqual([])
  })

  it('WM-06: the 5 cases blocked in L06 stay blocked by the default blocklist', () => {
    const words = ['STUPID', 'stüpid', 'you stupid', 'Đồ Ngốc', 'đồ  ngốc']
    expect(reasons(words)).toEqual([
      ['STUPID', 'blocked'],
      ['stüpid', 'blocked'],
      ['you stupid', 'blocked'],
      ['Đồ Ngốc', 'blocked'],
      ['đồ ngốc', 'blocked'],
    ])
  })

  it('WM-06: the 6 cases that slipped through in L06 are rejected by the default blocklist', () => {
    const words = ['thằng đồ ngốc', 'dumb-dumb', "idiot's", 'stup⃝id', 'stupid҉', 'stυpid']
    expect(reasons(words)).toEqual([
      ['thằng đồ ngốc', 'blocked'],
      ['dumb-dumb', 'blocked'],
      ["idiot's", 'blocked'],
      ['stup⃝id', 'blocked'],
      ['stupid҉', 'blocked'],
      ['stυpid', 'mixed_script'],
    ])
    expect(moderateWords(words).accepted).toEqual([])
  })
})
