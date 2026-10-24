import { describe, it, expect } from 'vitest'
import { buildLittleSession, getMasteredLetters, getLearningLetters } from '../little-session'
import { LETTER_ORDER } from '../little-content'
import type { LetterProgress, LittleItem } from '../types'

function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function mastered(letters: string): LetterProgress {
  return Object.fromEntries(letters.split('').map(l => [l, { seen: 5, firstTry: 3 }]))
}

function count(items: LittleItem[], target: string): number {
  return items.filter(i => i.target === target).length
}

describe('getMasteredLetters / getLearningLetters', () => {
  it('a letter with fewer than 3 first tries is not mastered', () => {
    const p: LetterProgress = { s: { seen: 2, firstTry: 1 } }
    expect(getMasteredLetters(p)).toEqual([])
    expect(getLearningLetters(p)).toContain('s')
  })

  it('learning letters are the next two unmastered in teaching order', () => {
    expect(getLearningLetters(mastered('satpinc'))).toEqual(['m', 'd'])
  })
})

describe('buildLittleSession', () => {
  it('builds 3 stages of 4 items', () => {
    const session = buildLittleSession({}, mulberry32(1))
    expect(session.stages).toHaveLength(3)
    for (const stage of session.stages) expect(stage).toHaveLength(4)
  })

  it('a brand new player only meets s and a, each twice in stage 2, with no words', () => {
    const session = buildLittleSession({}, mulberry32(7))
    const all = session.stages.flat()
    for (const item of all) expect(['s', 'a']).toContain(item.target)
    expect(all.every(i => i.kind === 'letter')).toBe(true)
    expect(count(session.stages[1], 's')).toBeGreaterThanOrEqual(2)
    expect(count(session.stages[1], 'a')).toBeGreaterThanOrEqual(2)
  })

  it('introduces the learning letters at least twice in stage 2', () => {
    const session = buildLittleSession(mastered('satpinc'), mulberry32(3))
    expect(count(session.stages[1], 'm')).toBeGreaterThanOrEqual(2)
    expect(count(session.stages[1], 'd')).toBeGreaterThanOrEqual(2)
  })

  it('stage 3 has two distinct words made only of mastered letters', () => {
    const known = 'satpinc'
    const session = buildLittleSession(mastered(known), mulberry32(5))
    const words = session.stages[2].filter(i => i.kind === 'word')
    expect(words).toHaveLength(2)
    expect(new Set(words.map(w => w.target)).size).toBe(2)
    for (const w of words) {
      for (const ch of w.target) expect(known).toContain(ch)
    }
  })

  it('stage 1 reviews only known or seen letters', () => {
    const p: LetterProgress = { ...mastered('sat'), p: { seen: 1, firstTry: 0 } }
    const session = buildLittleSession(p, mulberry32(9))
    for (const item of session.stages[0]) expect('satp').toContain(item.target)
  })

  it('handles a player who mastered every letter', () => {
    const session = buildLittleSession(mastered(LETTER_ORDER.join('')), mulberry32(11))
    expect(session.stages.flat()).toHaveLength(12)
    expect(session.stages.flat().some(i => i.kind === 'word')).toBe(true)
  })

  it('never puts the same target twice in a row', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const all = buildLittleSession(mastered('sat'), mulberry32(seed)).stages.flat()
      for (let i = 1; i < all.length; i++) {
        expect(all[i].target, `seed ${seed} at ${i}`).not.toBe(all[i - 1].target)
      }
    }
  })

  it('is deterministic for the same random source', () => {
    const a = buildLittleSession(mastered('satp'), mulberry32(42))
    const b = buildLittleSession(mastered('satp'), mulberry32(42))
    expect(a).toEqual(b)
  })

  it('letter items carry their picture card', () => {
    const session = buildLittleSession({}, mulberry32(2))
    const item = session.stages[0][0]
    expect(item.kind).toBe('letter')
    if (item.kind === 'letter') expect(item.card.letter).toBe(item.target)
  })
})
