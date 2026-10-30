import { describe, it, expect, beforeEach, vi } from 'vitest'

const loadModule = () => import('../little-content')

const EXPECTED_CARDS: [string, string, string][] = [
  ['a', 'apple', '🍎'],
  ['b', 'bear', '🐻'],
  ['c', 'cat', '🐱'],
  ['d', 'dog', '🐶'],
  ['e', 'egg', '🥚'],
  ['f', 'fish', '🐟'],
  ['g', 'grapes', '🍇'],
  ['h', 'hat', '🎩'],
  ['i', 'ice cream', '🍦'],
  ['j', 'juice', '🧃'],
  ['k', 'kite', '🪁'],
  ['l', 'lion', '🦁'],
  ['m', 'moon', '🌙'],
  ['n', 'nose', '👃'],
  ['o', 'orange', '🍊'],
  ['p', 'pig', '🐷'],
  ['q', 'queen', '👑'],
  ['r', 'rabbit', '🐰'],
  ['s', 'sun', '☀️'],
  ['t', 'tiger', '🐯'],
  ['u', 'umbrella', '☂️'],
  ['v', 'van', '🚐'],
  ['w', 'whale', '🐳'],
  ['x', 'fox', '🦊'],
  ['y', 'yo-yo', '🪀'],
  ['z', 'zebra', '🦓'],
]

const EXPECTED_PICTURE_WORDS: [string, string][] = [
  ['cat', '🐱'],
  ['dog', '🐶'],
  ['sun', '☀️'],
  ['hat', '🎩'],
  ['pig', '🐷'],
  ['bus', '🚌'],
  ['cup', '🥤'],
  ['bed', '🛏️'],
  ['hen', '🐔'],
  ['fox', '🦊'],
  ['box', '📦'],
  ['ant', '🐜'],
  ['bat', '🦇'],
  ['map', '🗺️'],
  ['pan', '🍳'],
  ['net', '🥅'],
  ['pin', '📌'],
  ['mop', '🧹'],
  ['cow', '🐮'],
  ['bee', '🐝'],
  ['owl', '🦉'],
  ['web', '🕸️'],
]

const EXPECTED_STICKERS: [string, string][] = [
  ['🐱', 'kitty'],
  ['🐶', 'puppy'],
  ['🐼', 'panda'],
  ['🦄', 'unicorn'],
  ['🐻', 'teddy bear'],
  ['🐸', 'frog'],
  ['🦋', 'butterfly'],
  ['🐰', 'bunny'],
  ['🦊', 'fox'],
  ['🐨', 'koala'],
  ['🐯', 'tiger'],
  ['🦁', 'lion'],
  ['🐮', 'cow'],
  ['🐷', 'piggy'],
  ['🐵', 'monkey'],
  ['🐧', 'penguin'],
  ['🐥', 'chick'],
  ['🐢', 'turtle'],
  ['🐙', 'octopus'],
  ['🐳', 'whale'],
  ['🐬', 'dolphin'],
  ['🦕', 'dinosaur'],
  ['🐝', 'bee'],
  ['🐞', 'ladybug'],
  ['🌈', 'rainbow'],
  ['⭐', 'star'],
  ['🚀', 'rocket'],
  ['🎈', 'balloon'],
  ['🍓', 'strawberry'],
  ['🧁', 'cupcake'],
]

describe('little-content module initialisation via await import()', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('imports without throwing and exposes every table', async () => {
    const mod = await loadModule()
    expect(Array.isArray(mod.LETTER_ORDER)).toBe(true)
    expect(typeof mod.LETTER_CARDS).toBe('object')
    expect(Array.isArray(mod.PICTURE_WORDS)).toBe(true)
    expect(Array.isArray(mod.STICKERS)).toBe(true)
  })

  it('builds LETTER_ORDER from the phonics string split into single letters', async () => {
    const { LETTER_ORDER } = await loadModule()
    expect(LETTER_ORDER).toEqual([
      's',
      'a',
      't',
      'p',
      'i',
      'n',
      'm',
      'd',
      'g',
      'o',
      'c',
      'k',
      'e',
      'u',
      'r',
      'h',
      'b',
      'f',
      'l',
      'j',
      'v',
      'w',
      'x',
      'y',
      'z',
      'q',
    ])
  })

  it('exports the exact numeric constants', async () => {
    const mod = await loadModule()
    expect(mod.MASTERY_FIRST_TRY).toBe(3)
    expect(mod.STAGE_COUNT).toBe(3)
    expect(mod.ITEMS_PER_STAGE).toBe(4)
    expect(mod.HINT_LEVEL_1_MS).toBe(4000)
    expect(mod.HINT_LEVEL_2_MS).toBe(8000)
    expect(mod.DEFAULT_DAILY_LIMIT).toBe(2)
    expect(mod.MIN_DAILY_LIMIT).toBe(1)
    expect(mod.MAX_DAILY_LIMIT).toBe(5)
    expect(mod.PRAISE_COUNT).toBe(6)
  })

  it('builds LETTER_CARDS keyed by letter with exactly 26 entries', async () => {
    const { LETTER_CARDS } = await loadModule()
    expect(Object.keys(LETTER_CARDS)).toHaveLength(26)
    expect(Object.keys(LETTER_CARDS)).toEqual(EXPECTED_CARDS.map(([letter]) => letter))
  })

  it.each(EXPECTED_CARDS)(
    'maps letter %s to word %s with emoji %s',
    async (letter, word, emoji) => {
      const { LETTER_CARDS } = await loadModule()
      expect(LETTER_CARDS[letter]).toEqual({ letter, word, emoji })
    },
  )

  it('builds PICTURE_WORDS in the declared order', async () => {
    const { PICTURE_WORDS } = await loadModule()
    expect(PICTURE_WORDS).toEqual(EXPECTED_PICTURE_WORDS.map(([word, emoji]) => ({ word, emoji })))
  })

  it('builds STICKERS in the declared order', async () => {
    const { STICKERS } = await loadModule()
    expect(STICKERS).toEqual(EXPECTED_STICKERS.map(([emoji, name]) => ({ emoji, name })))
  })
})
