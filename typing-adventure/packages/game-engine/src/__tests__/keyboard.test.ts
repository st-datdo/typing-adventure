import { describe, expect, it } from 'vitest'

const load = () => import('../keyboard')

const LP = 'left-pinky'
const LR = 'left-ring'
const LM = 'left-middle'
const LI = 'left-index'
const RI = 'right-index'
const RM = 'right-middle'
const RR = 'right-ring'
const RP = 'right-pinky'

const EXPECTED_ROWS = [
  [
    ['`', LP],
    ['1', LP],
    ['2', LR],
    ['3', LM],
    ['4', LI],
    ['5', LI],
    ['6', RI],
    ['7', RI],
    ['8', RM],
    ['9', RR],
    ['0', RP],
    ['-', RP],
    ['=', RP],
    ['Backspace', RP],
  ],
  [
    ['Tab', LP],
    ['q', LP],
    ['w', LR],
    ['e', LM],
    ['r', LI],
    ['t', LI],
    ['y', RI],
    ['u', RI],
    ['i', RM],
    ['o', RR],
    ['p', RP],
    ['[', RP],
    [']', RP],
    ['\\', RP],
  ],
  [
    ['CapsLock', LP],
    ['a', LP],
    ['s', LR],
    ['d', LM],
    ['f', LI],
    ['g', LI],
    ['h', RI],
    ['j', RI],
    ['k', RM],
    ['l', RR],
    [';', RP],
    ["'", RP],
    ['Enter', RP],
  ],
  [
    ['ShiftLeft', LP],
    ['z', LP],
    ['x', LR],
    ['c', LM],
    ['v', LI],
    ['b', LI],
    ['n', RI],
    ['m', RI],
    [',', RM],
    ['.', RR],
    ['/', RP],
    ['ShiftRight', RP],
  ],
  [[' ', 'thumb']],
]

describe('KEYBOARD_ROWS', () => {
  it('follows the standard touch-typing finger layout, row by row', async () => {
    const { KEYBOARD_ROWS } = await load()
    expect(KEYBOARD_ROWS.map((row) => row.map((k) => [k.key, k.finger]))).toEqual(EXPECTED_ROWS)
  })

  it('labels and styles the wide keys', async () => {
    const { KEYBOARD_ROWS } = await load()
    const wide = KEYBOARD_ROWS.flat()
      .filter((k) => k.label !== undefined || k.cls !== undefined)
      .map((k) => [k.key, k.label, k.cls])
    expect(wide).toEqual([
      ['Backspace', '⌫', 'backspace'],
      ['Tab', 'Tab', 'tab'],
      ['CapsLock', 'Caps', 'caps'],
      ['Enter', 'Enter', 'enter'],
      ['ShiftLeft', 'Shift', 'shift'],
      ['ShiftRight', 'Shift', 'shift'],
      [' ', 'Space', 'space'],
    ])
  })

  it('maps every key by its lowercase name', async () => {
    const { KEYBOARD_ROWS, KEY_FINGER_MAP } = await load()
    expect(KEY_FINGER_MAP['backspace']).toBe(RP)
    expect(KEY_FINGER_MAP['capslock']).toBe(LP)
    expect(KEY_FINGER_MAP['shiftright']).toBe(RP)
    expect(Object.keys(KEY_FINGER_MAP)).toHaveLength(KEYBOARD_ROWS.flat().length)
  })
})

describe('getFingerForKey', () => {
  it('returns the finger for home row keys', async () => {
    const { getFingerForKey } = await load()
    expect(getFingerForKey('f')).toBe(LI)
    expect(getFingerForKey('j')).toBe(RI)
  })

  it('is case-insensitive', async () => {
    const { getFingerForKey } = await load()
    expect(getFingerForKey('A')).toBe(LP)
    expect(getFingerForKey('Enter')).toBe(RP)
  })

  it('maps space to the thumb', async () => {
    const { getFingerForKey } = await load()
    expect(getFingerForKey(' ')).toBe('thumb')
  })

  it('returns null for keys outside the layout', async () => {
    const { getFingerForKey } = await load()
    expect(getFingerForKey('é')).toBeNull()
    expect(getFingerForKey('F1')).toBeNull()
  })
})
