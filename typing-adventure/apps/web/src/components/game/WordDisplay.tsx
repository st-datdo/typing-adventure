'use client'

import { useRef, type CSSProperties } from 'react'
import type { GameState } from '@typing-adventure/game-engine'
import { useSettingsStore } from '@/stores/settings-store'
import { t, tReplace } from '@typing-adventure/i18n'
import { Icon } from '@/components/ui/icons/Icon'
import type { FxState } from '@/lib/fx/director'
import { KeyParticles } from './fx/KeyParticles'
import { WordCompleteFx } from './fx/WordCompleteFx'

interface WordDisplayProps {
  gameState: GameState
  onCustomText?: () => void
  pop?: { index: number; kind: string; id: number; amp?: number } | null
  word?: FxState['word']
  superMode?: string | null
  fxSuppressed?: boolean
}

const WAVE_KINDS = ['domino', 'rainbow-wave']
const WORD_FX_MS = 700

export function WordDisplay({
  gameState,
  onCustomText,
  pop = null,
  word = null,
  superMode = null,
  fxSuppressed = false,
}: WordDisplayProps) {
  const keyboardCase = useSettingsStore((s) => s.keyboardCase)
  const lang = useSettingsStore((s) => s.lang)
  const layerRef = useRef<HTMLDivElement>(null)
  const { text, currentIndex } = gameState
  const progress = text.length > 0 ? (currentIndex / text.length) * 100 : 0
  const wave = word && !fxSuppressed && WAVE_KINDS.includes(word.kind) ? word : null
  const step = wave ? (wave.kind === 'domino' ? 35 : 30) : 0
  const charMs = wave?.kind === 'domino' ? 280 : 300

  const renderChar = (char: string, i: number) => {
    let className = 'char'
    if (char === ' ') className += ' char--space'

    const popped = !fxSuppressed && pop !== null && pop.index === i && i < currentIndex
    const waved = !!wave && i >= wave.range[0] && i < wave.range[1]
    let style: CSSProperties | undefined
    if (i < currentIndex) {
      className += ' char--correct'
    } else if (i === currentIndex) {
      className += ' char--active'
    } else {
      className += ' char--pending'
    }
    if (waved || popped) {
      style = {
        ...(popped && pop?.amp ? { '--fx-amp': pop.amp } : {}),
        ...(waved
          ? {
              '--fx-d': `${Math.min((i - (wave?.range[0] ?? 0)) * step, WORD_FX_MS - charMs)}ms`,
              '--fx-hue': `var(--kr-${['play', 'fun', 'primary'][(i - (wave?.range[0] ?? 0)) % 3]})`,
            }
          : {}),
      } as CSSProperties
    }

    const displayChar =
      char === ' ' ? '\u00A0' : keyboardCase === 'upper' ? char.toUpperCase() : char

    return (
      <span
        key={popped ? `${i}-p${pop?.id}` : waved ? `${i}-w${wave?.id}` : i}
        className={className}
        data-i={i}
        data-pop={popped ? pop?.kind : undefined}
        data-wfx={waved ? wave?.kind : undefined}
        style={style}
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
      {gameState.gameMode === 'challenge' && (
        <div
          className="lives-display lives--visible"
          role="img"
          aria-label={tReplace(lang, 'livesLabel', gameState.lives)}
        >
          {[0, 1, 2].map((i) => (
            <Icon
              key={i}
              name={i < gameState.lives ? 'heart' : 'heartOutline'}
              size={22}
              className={i < gameState.lives ? 'life life--on' : 'life life--off'}
            />
          ))}
        </div>
      )}

      <div className="word-display" data-fx-super={superMode ?? undefined}>
        {groups.map((g) =>
          g.space ? (
            renderChar(g.chars[0], g.start)
          ) : (
            <span key={`w${g.start}`} className="word">
              {g.chars.map((c, j) => renderChar(c, g.start + j))}
            </span>
          ),
        )}
      </div>

      <div className="fx-word-layer" aria-hidden="true" ref={layerRef}>
        <KeyParticles layerRef={layerRef} suppressed={fxSuppressed} />
        <WordCompleteFx layerRef={layerRef} suppressed={fxSuppressed} />
      </div>

      <div className="word-foot">
        <div className="fx-runner-track" aria-hidden="true" />
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        {onCustomText && (
          <button
            className="ui-chip ui-chip--text btn-custom-text"
            onClick={(e) => {
              e.stopPropagation()
              onCustomText()
            }}
            type="button"
            title={t(lang, 'tipCustomText')}
          >
            <Icon name="pencil" size={20} />{' '}
            <span className="btn-custom-label">{t(lang, 'tipCustomText')}</span>
          </button>
        )}
      </div>
    </section>
  )
}
