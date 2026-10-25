'use client'

import { useEffect, useRef } from 'react'
import type { GameState } from '@typing-adventure/game-engine'
import { useSettingsStore } from '@/stores/settings-store'
import { t } from '@typing-adventure/i18n'

interface WordDisplayProps {
  gameState: GameState
  onCustomText?: () => void
}

export function WordDisplay({ gameState, onCustomText }: WordDisplayProps) {
  const keyboardCase = useSettingsStore(s => s.keyboardCase)
  const soundMode = useSettingsStore(s => s.soundMode)
  const lang = useSettingsStore(s => s.lang)
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

  const renderChar = (char: string, i: number) => {
    let className = 'char'
    if (char === ' ') className += ' char--space'

    if (i < currentIndex) {
      className += ' char--correct'
      if (i === justTypedIndex) {
        className += ' char--pop'
      }
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
  }

  const groups: { start: number; chars: string[]; space: boolean }[] = []
  text.split('').forEach((char, i) => {
    const last = groups[groups.length - 1]
    const isSpace = char === ' '
    if (!last || isSpace || last.space) {
      groups.push({ start: i, chars: [char], space: isSpace })
    } else {
      last.chars.push(char)
    }
  })

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
        {groups.map((g) => g.space
          ? renderChar(g.chars[0], g.start)
          : (
            <span key={`w${g.start}`} className="word">
              {g.chars.map((c, j) => renderChar(c, g.start + j))}
            </span>
          ))}
      </div>

      <div className="word-foot">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        {onCustomText && (
          <button
            className="ui-chip ui-chip--text btn-custom-text"
            onClick={(e) => { e.stopPropagation(); onCustomText() }}
            type="button"
            title={t(lang, 'tipCustomText')}
          >
            ✏️ <span className="btn-custom-label">{t(lang, 'tipCustomText')}</span>
          </button>
        )}
      </div>
    </section>
  )
}
