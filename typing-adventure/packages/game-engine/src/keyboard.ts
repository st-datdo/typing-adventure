import type { KeyDef, Finger } from './types'

export const KEYBOARD_ROWS: KeyDef[][] = [
  [
    { key: '`', finger: 'left-pinky' },
    { key: '1', finger: 'left-pinky' },
    { key: '2', finger: 'left-ring' },
    { key: '3', finger: 'left-middle' },
    { key: '4', finger: 'left-index' },
    { key: '5', finger: 'left-index' },
    { key: '6', finger: 'right-index' },
    { key: '7', finger: 'right-index' },
    { key: '8', finger: 'right-middle' },
    { key: '9', finger: 'right-ring' },
    { key: '0', finger: 'right-pinky' },
    { key: '-', finger: 'right-pinky' },
    { key: '=', finger: 'right-pinky' },
    { key: 'Backspace', label: '⌫', finger: 'right-pinky', cls: 'backspace' },
  ],
  [
    { key: 'Tab', label: 'Tab', finger: 'left-pinky', cls: 'tab' },
    { key: 'q', finger: 'left-pinky' },
    { key: 'w', finger: 'left-ring' },
    { key: 'e', finger: 'left-middle' },
    { key: 'r', finger: 'left-index' },
    { key: 't', finger: 'left-index' },
    { key: 'y', finger: 'right-index' },
    { key: 'u', finger: 'right-index' },
    { key: 'i', finger: 'right-middle' },
    { key: 'o', finger: 'right-ring' },
    { key: 'p', finger: 'right-pinky' },
    { key: '[', finger: 'right-pinky' },
    { key: ']', finger: 'right-pinky' },
    { key: '\\', finger: 'right-pinky' },
  ],
  [
    { key: 'CapsLock', label: 'Caps', finger: 'left-pinky', cls: 'caps' },
    { key: 'a', finger: 'left-pinky' },
    { key: 's', finger: 'left-ring' },
    { key: 'd', finger: 'left-middle' },
    { key: 'f', finger: 'left-index' },
    { key: 'g', finger: 'left-index' },
    { key: 'h', finger: 'right-index' },
    { key: 'j', finger: 'right-index' },
    { key: 'k', finger: 'right-middle' },
    { key: 'l', finger: 'right-ring' },
    { key: ';', finger: 'right-pinky' },
    { key: "'", finger: 'right-pinky' },
    { key: 'Enter', label: 'Enter', finger: 'right-pinky', cls: 'enter' },
  ],
  [
    { key: 'ShiftLeft', label: 'Shift', finger: 'left-pinky', cls: 'shift' },
    { key: 'z', finger: 'left-pinky' },
    { key: 'x', finger: 'left-ring' },
    { key: 'c', finger: 'left-middle' },
    { key: 'v', finger: 'left-index' },
    { key: 'b', finger: 'left-index' },
    { key: 'n', finger: 'right-index' },
    { key: 'm', finger: 'right-index' },
    { key: ',', finger: 'right-middle' },
    { key: '.', finger: 'right-ring' },
    { key: '/', finger: 'right-pinky' },
    { key: 'ShiftRight', label: 'Shift', finger: 'right-pinky', cls: 'shift' },
  ],
  [
    { key: ' ', label: 'Space', finger: 'thumb', cls: 'space' },
  ],
]

const KEY_FINGER_MAP: Record<string, Finger> = {}
for (const row of KEYBOARD_ROWS) {
  for (const k of row) {
    KEY_FINGER_MAP[k.key.toLowerCase()] = k.finger
  }
}

export { KEY_FINGER_MAP }

export function getFingerForKey(key: string): Finger | null {
  const keyName = key === ' ' ? ' ' : key.toLowerCase()
  return KEY_FINGER_MAP[keyName] ?? null
}
