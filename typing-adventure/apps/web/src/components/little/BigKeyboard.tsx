'use client'

import { KEYBOARD_ROWS } from '@typing-adventure/game-engine'

const LETTER_ROWS: string[][] = KEYBOARD_ROWS
  .map(row => row.map(k => k.key).filter(k => /^[a-z]$/.test(k)))
  .filter(row => row.length > 0)

interface BigKeyboardProps {
  target: string | null
  hintLevel: 0 | 1 | 2
  wrongKey: { key: string; id: number } | null
  pressedKey: { key: string; id: number } | null
  onPress: (key: string) => void
}

export function BigKeyboard({ target, hintLevel, wrongKey, pressedKey, onPress }: BigKeyboardProps) {
  return (
    <div className={`little-kb little-kb--hint${hintLevel}`}>
      {LETTER_ROWS.map((row, ri) => (
        <div key={ri} className="little-kb-row">
          {row.map(key => {
            let cls = 'little-key'
            if (key === target) cls += ' little-key--target'
            if (wrongKey?.key === key) cls += ' little-key--wrong'
            if (pressedKey?.key === key) cls += ' little-key--pressed'
            const animKey = key === wrongKey?.key ? `w${wrongKey.id}` : key === pressedKey?.key ? `p${pressedKey.id}` : key
            return (
              <button
                key={`${key}-${animKey}`}
                type="button"
                className={cls}
                aria-label={key.toUpperCase()}
                onPointerDown={(e) => {
                  e.preventDefault()
                  onPress(key)
                }}
              >
                {key.toUpperCase()}
                {key === target && hintLevel === 2 && <span className="little-key-hand" aria-hidden>👇</span>}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
