'use client'

import { useState, useEffect, useCallback } from 'react'
import { KEYBOARD_ROWS, getFingerForKey } from '@typing-adventure/game-engine'
import type { GameState } from '@typing-adventure/game-engine'
import { useSettingsStore } from '@/stores/settings-store'

interface KeyboardProps {
  gameState: GameState
  onKeyClick: (key: string) => void
}

export function Keyboard({ gameState, onKeyClick }: KeyboardProps) {
  const keyboardCase = useSettingsStore(s => s.keyboardCase)
  const fingerGuide = useSettingsStore(s => s.fingerGuide)
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set())
  const [flashKeys, setFlashKeys] = useState<Record<string, 'correct' | 'wrong'>>({})

  const expectedKey = gameState.currentIndex < gameState.text.length
    ? gameState.text[gameState.currentIndex]
    : null

  const highlightKeyName = expectedKey === ' ' ? ' ' : expectedKey?.toLowerCase() ?? null

  // Flash effect
  const flashKey = useCallback((keyName: string, isCorrect: boolean) => {
    setFlashKeys(prev => ({ ...prev, [keyName]: isCorrect ? 'correct' : 'wrong' }))
    setTimeout(() => {
      setFlashKeys(prev => {
        const next = { ...prev }
        delete next[keyName]
        return next
      })
    }, 200)
  }, [])

  // Listen for keyboard events for visual feedback
  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
      const keyName = e.key.toLowerCase()
      setPressedKeys(prev => new Set(prev).add(keyName))
    }
    const handleUp = (e: KeyboardEvent) => {
      const keyName = e.key.toLowerCase()
      setPressedKeys(prev => {
        const next = new Set(prev)
        next.delete(keyName)
        return next
      })
    }
    window.addEventListener('keydown', handleDown)
    window.addEventListener('keyup', handleUp)
    return () => {
      window.removeEventListener('keydown', handleDown)
      window.removeEventListener('keyup', handleUp)
    }
  }, [])

  return (
    <section className="keyboard-section">
      <div className={`keyboard ${!fingerGuide ? 'keyboard--hide-fingers' : ''}`}>
        {KEYBOARD_ROWS.map((row, ri) => (
          <div key={ri} className="keyboard-row">
            {row.map((k) => {
              const keyLower = k.key.toLowerCase()
              const displayText = k.label ?? k.key
              const display = keyboardCase === 'upper'
                ? displayText.toUpperCase()
                : displayText

              let className = 'key'
              if (k.cls) className += ` key--${k.cls}`
              if (k.finger) className += ` key--finger-${k.finger}`
              if (keyLower === highlightKeyName) className += ' key--highlight'
              if (pressedKeys.has(keyLower)) className += ' key--pressed'
              if (flashKeys[keyLower] === 'correct') className += ' key--correct'
              if (flashKeys[keyLower] === 'wrong') className += ' key--wrong'

              return (
                <div
                  key={k.key}
                  className={className}
                  data-key={keyLower}
                  onPointerDown={() => {
                    if (k.key.length === 1 || k.key === ' ') {
                      onKeyClick(k.key)
                    }
                  }}
                >
                  {display}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </section>
  )
}
