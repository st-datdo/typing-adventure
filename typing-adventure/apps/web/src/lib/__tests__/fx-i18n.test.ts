import { describe, expect, it } from 'vitest'
import { vi as viDict, en as enDict } from '@typing-adventure/i18n'

const SETTINGS_KEYS = [
  'fxLabel',
  'fxDesc',
  'fxLots',
  'fxSome',
  'fxFew',
  'fxLotsHint',
  'fxSomeHint',
  'fxFewHint',
  'fxReducedNote',
]

const range = (prefix: string, n: number) =>
  Array.from({ length: n }, (_, i) => `${prefix}${i + 1}`)

const PRAISE = range('fxPraise', 24)
const OWL_PRAISE = range('fxOwlPraise', 20)
const ENCOURAGE = range('fxOwlEncourage', 6)
const ALL = [...SETTINGS_KEYS, ...PRAISE, ...OWL_PRAISE, ...ENCOURAGE]

const dicts = { vi: viDict as Record<string, string>, en: enDict as Record<string, string> }

describe('FX i18n', () => {
  it('FX-20 every fx key exists non-empty in vi and en', () => {
    expect(ALL).toHaveLength(59)
    for (const [lang, d] of Object.entries(dicts)) {
      for (const k of ALL) {
        expect(typeof d[k], `${lang}.${k}`).toBe('string')
        expect(d[k].trim().length, `${lang}.${k}`).toBeGreaterThan(0)
      }
    }
  })

  it('FX-05 pool sizes and no duplicate within a pool', () => {
    for (const [lang, d] of Object.entries(dicts)) {
      for (const [pool, min] of [
        [PRAISE, 20],
        [OWL_PRAISE, 20],
        [ENCOURAGE, 5],
      ] as const) {
        const texts = pool.map((k) => d[k])
        expect(texts.length).toBeGreaterThanOrEqual(min)
        expect(new Set(texts).size, `${lang} ${pool[0]}`).toBe(texts.length)
      }
    }
  })

  it('FX-14 labels', () => {
    expect(dicts.vi.fxLabel).toBe('Hiệu ứng')
    expect(dicts.en.fxLabel).toBe('Effects')
    expect([dicts.vi.fxLots, dicts.vi.fxSome, dicts.vi.fxFew]).toEqual(['Nhiều', 'Vừa', 'Ít'])
    expect([dicts.en.fxLots, dicts.en.fxSome, dicts.en.fxFew]).toEqual(['Lots', 'Some', 'Few'])
  })

  it('FX-12 encourage example', () => {
    expect(dicts.vi.fxOwlEncourage1).toBe('Không sao, lại nào!')
    expect(dicts.en.fxOwlEncourage1).toBe('No worries, try again!')
  })

  it('FX-20 vi diacritics', () => {
    const texts = [...PRAISE, ...OWL_PRAISE].map((k) => dicts.vi[k])
    const marked = texts.filter((s) => /[À-ỹ]/.test(s)).length
    expect(marked / texts.length).toBeGreaterThanOrEqual(0.8)
  })

  it('FX-20 length', () => {
    for (const [lang, d] of Object.entries(dicts)) {
      for (const k of [...PRAISE, ...OWL_PRAISE, ...ENCOURAGE]) {
        expect([...d[k]].length, `${lang}.${k}`).toBeLessThanOrEqual(32)
      }
    }
  })

  it('FX-02 comboPraise kept', () => {
    expect(dicts.vi.comboPraise10).toBe('Siêu quá!')
    expect(dicts.en.comboPraise10).toBe('Super!')
  })
})
