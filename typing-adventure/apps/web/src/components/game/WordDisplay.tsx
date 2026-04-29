'use client'

import type { GameState } from '@typing-adventure/game-engine'
import { useSettingsStore } from '@/stores/settings-store'

interface WordDisplayProps {
  gameState: GameState
}

export function WordDisplay({ gameState }: WordDisplayProps) {
  const keyboardCase = useSettingsStore(s => s.keyboardCase)
  const { text, currentIndex } = gameState
  const progress = text.length > 0 ? (currentIndex / text.length) * 100 : 0

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
          if (i < currentIndex) className += ' char--correct'
          else if (i === currentIndex) className += ' char--active'
          else className += ' char--pending'

          const displayChar = char === ' '
            ? '\u00A0'
            : keyboardCase === 'upper'
              ? char.toUpperCase()
              : char

          return (
            <span key={i} className={className}>
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
