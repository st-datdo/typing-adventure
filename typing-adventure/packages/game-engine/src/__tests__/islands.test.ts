import { describe, it, expect } from 'vitest'
import { ISLANDS, countDoneIslands, getCurrentIsland, getIslandViews, newlyReachedIsland } from '../islands'
import { LETTER_ORDER, MASTERY_FIRST_TRY } from '../little-content'
import type { LetterProgress } from '../types'

function masteredAll(letters: string[]): LetterProgress {
  return Object.fromEntries(letters.map(l => [l, { seen: MASTERY_FIRST_TRY, firstTry: MASTERY_FIRST_TRY }]))
}

describe('ISLANDS', () => {
  it('cover the learning order exactly once, in order', () => {
    expect(ISLANDS.flatMap(i => i.letters)).toEqual(LETTER_ORDER)
  })
})

describe('getIslandViews', () => {
  it('starts on the first island with the rest locked', () => {
    const views = getIslandViews({})
    expect(views.map(v => v.status)).toEqual(['current', 'locked', 'locked', 'locked', 'locked'])
  })

  it('marks an island done when every letter is mastered', () => {
    const views = getIslandViews(masteredAll(ISLANDS[0].letters))
    expect(views[0].status).toBe('done')
    expect(views[1].status).toBe('current')
    expect(getCurrentIsland(masteredAll(ISLANDS[0].letters))?.id).toBe('forest')
  })

  it('lists mastered letters of the current island', () => {
    const views = getIslandViews(masteredAll(['s', 'a']))
    expect(views[0].mastered).toEqual(['s', 'a'])
    expect(views[0].status).toBe('current')
  })

  it('has no current island when everything is mastered', () => {
    const all = masteredAll(LETTER_ORDER)
    expect(countDoneIslands(all)).toBe(ISLANDS.length)
    expect(getCurrentIsland(all)).toBeNull()
  })
})

describe('newlyReachedIsland', () => {
  it('is null when no island was completed', () => {
    expect(newlyReachedIsland({}, masteredAll(['s']))).toBeNull()
  })

  it('returns the next island after finishing one', () => {
    const before = masteredAll(['s', 'a', 't', 'p', 'i'])
    const after = masteredAll(ISLANDS[0].letters)
    expect(newlyReachedIsland(before, after)?.id).toBe('forest')
  })

  it('returns the last island when the final one is completed', () => {
    const before = masteredAll(LETTER_ORDER.slice(0, -1))
    expect(newlyReachedIsland(before, masteredAll(LETTER_ORDER))?.id).toBe('star')
  })
})
