import { describe, expect, it } from 'vitest'
import * as rateLimit from '../rate-limit'

const limiterEmailKey = (email: unknown) =>
  (rateLimit as unknown as { limiterEmailKey: (email: unknown) => string }).limiterEmailKey(email)

describe('limiterEmailKey', () => {
  it('RC-04: is exported from lib/rate-limit', () => {
    expect(typeof (rateLimit as Record<string, unknown>).limiterEmailKey).toBe('function')
  })

  it('RC-04: keeps a normalized email of at most 254 characters unchanged', () => {
    expect(limiterEmailKey('  Ana@X.io ')).toBe('ana@x.io')
    const max = `  ${'B'.repeat(246)}@x.io.vn  `
    expect(limiterEmailKey(max)).toBe(`${'b'.repeat(246)}@x.io.vn`)
    expect(limiterEmailKey(max)).toHaveLength(254)
  })

  it('RC-04: cuts a normalized email longer than 254 characters to its first 254', () => {
    const email = 'a'.repeat(200) + 'İ'.repeat(54)
    const normalized = rateLimit.normalizeEmail(email)
    expect(normalized).toHaveLength(308)
    const key = limiterEmailKey(email)
    expect(key).toHaveLength(254)
    expect(key).toBe(normalized.slice(0, 254))
  })

  it('RC-04: cuts a long ASCII email to exactly 254 characters', () => {
    const long = `${'c'.repeat(300)}@x.io`
    expect(limiterEmailKey(long)).toBe('c'.repeat(254))
  })

  it('RC-04: returns an empty string for values that are not strings', () => {
    expect(limiterEmailKey(undefined)).toBe('')
    expect(limiterEmailKey(null)).toBe('')
    expect(limiterEmailKey(42)).toBe('')
    expect(limiterEmailKey(['a@x.io'])).toBe('')
  })
})
