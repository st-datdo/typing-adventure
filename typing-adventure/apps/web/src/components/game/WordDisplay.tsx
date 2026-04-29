'use client'

import { useEffect, useRef } from 'react'
import type { GameState } from '@typing-adventure/game-engine'
import { useSettingsStore } from '@/stores/settings-store'

interface WordDisplayProps {
  gameState: GameState
}

export function WordDisplay({ gameState }: WordDisplayProps) {
  const keyboardCase = useSettingsStore(s => s.keyboardCase)
  const soundMode = useSettingsStore(s => s.soundMode)
  const { text, currentIndex } = gameState
  const progress = text.length > 0 ? (currentIndex / text.length) * 100 : 0
  const prevIndexRef = useRef(currentIndex)

  // Track which char just became correct this render
  const justTypedIndex = currentIndex > prevIndexRef.current
    ? prevIndexRef.current
    : -1

  useEffect(() => {
    prevIndexRef.current = currentIndex
  }, [currentIndex])

  // Determine word-burst range when a word completes in word mode
  let wordBurstStart = -1
  let wordBurstEnd = -1
  if (soundMode === 'word' && justTypedIndex >= 0) {
    // Check if a word just completed (next char is space or end of text)
    const nextChar = text[currentIndex]
    if (nextChar === ' ' || nextChar === undefined) {
      // Walk back to find word start
      let start = justTypedIndex
      while (start > 0 && text[start - 1] !== ' ') {
        start--
      }
      wordBurstStart = start
      wordBurstEnd = currentIndex
    }
  }

  return (
    <section className="word-display-section">
      {gameState.combo >= 2 && (
        <div className="combo-display combo--visible">
          x{gameState.combo}
        </div>
      )}

      {gameState.gameMode === 'challenge' && (
        <div className="lives-display lives--visible">
          {'❤️'.repeat(gameState.lives)}
          {'🖤'.repeat(3 - gameState.lives)}
        </div>
      )}

      <div className="word-display">
        {text.split('').map((char, i) => {
          let className = 'char'
          if (char === ' ') className += ' char--space'

          if (i < currentIndex) {
            className += ' char--correct'

            // Pop animation on the char that was just typed
            if (i === justTypedIndex) {
              className += ' char--pop'
            }

            // Word-burst animation for completed word in word mode
            if (i >= wordBurstStart && i < wordBurstEnd && wordBurstStart >= 0) {
              className += ' char--word-burst'
            }
          } else if (i === currentIndex) {
            className += ' char--active'
          } else {
            className += ' char--pending'
          }

          const displayChar = char === ' '
            ? '\u00A0'
            : keyboardCase === 'upper'
              ? char.toUpperCase()
              : char

          return (
            <span
              key={i}
              className={className}
              style={
                i >= wordBurstStart && i < wordBurstEnd && wordBurstStart >= 0
                  ? { animationDelay: `${(i - wordBurstStart) * 60}ms` }
                  : undefined
              }
            >
              {displayChar}
            </span>
          )
        })}
      </div>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
    </section>
  )
}
