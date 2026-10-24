'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  buildLittleSession,
  createLittleState,
  getCurrentItem,
  getExpectedChar,
  getHintLevel,
  littleKeypress,
  pickPraiseIndex,
  STAGE_COUNT,
} from '@typing-adventure/game-engine'
import type { LetterProgress, LittleItem, LittleState } from '@typing-adventure/game-engine'
import { t } from '@typing-adventure/i18n'
import type { TranslationKey } from '@typing-adventure/i18n'
import { useLittleStore } from '@/stores/little-store'
import { useSettingsStore } from '@/stores/settings-store'
import type { LittleVoice } from '@/hooks/useLittleVoice'
import { Mascot } from './Mascot'
import { Burst } from './Burst'
import { BigKeyboard } from './BigKeyboard'

const ITEM_PAUSE_MS = 1600
const STAGE_PAUSE_MS = 2200
const HINT_TICK_MS = 250
const WRONG_FLASH_MS = 450
const PRESS_FLASH_MS = 300

interface LittlePlayProps {
  voice: LittleVoice
  onFinish: (result: { progress: LetterProgress; found: number }) => void
  onExit: (progress: LetterProgress) => void
}

interface Paused {
  item: LittleItem
  praise: number
  stageUp: boolean
}

function itemEmoji(item: LittleItem): string {
  return item.kind === 'letter' ? item.card.emoji : item.picture.emoji
}

export function LittlePlay({ voice, onFinish, onExit }: LittlePlayProps) {
  const lang = useSettingsStore(s => s.lang)
  const [game, setGame] = useState<LittleState>(() => {
    const progress = useLittleStore.getState().progress
    return createLittleState(buildLittleSession(progress, Math.random), progress)
  })
  const [paused, setPaused] = useState<Paused | null>(null)
  const [hint, setHint] = useState<0 | 1 | 2>(0)
  const [burst, setBurst] = useState({ id: 0, emoji: '✨' })
  const [wrongKey, setWrongKey] = useState<{ key: string; id: number } | null>(null)
  const [pressedKey, setPressedKey] = useState<{ key: string; id: number } | null>(null)

  const gameRef = useRef(game)
  const busyUntilRef = useRef(0)
  const lastActivityRef = useRef(0)
  const hintSpokenRef = useRef(0)
  const flashIdRef = useRef(0)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const later = useCallback((fn: () => void, ms: number) => {
    timersRef.current.push(setTimeout(fn, ms))
  }, [])

  useEffect(() => {
    lastActivityRef.current = performance.now()
    const first = getCurrentItem(gameRef.current)
    const timer = setTimeout(() => {
      if (first) voice.prompt(first)
    }, 300)
    return () => clearTimeout(timer)
  }, [voice])

  useEffect(() => () => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }, [])

  const handleKey = useCallback((raw: string) => {
    const now = performance.now()
    if (now < busyUntilRef.current) return
    const before = gameRef.current
    const item = getCurrentItem(before)
    const { state, outcome } = littleKeypress(before, raw)
    if (outcome === 'ignored' || !item) return

    lastActivityRef.current = now
    hintSpokenRef.current = 0
    setHint(0)
    gameRef.current = state
    setGame(state)
    const ch = raw.toLowerCase()
    flashIdRef.current += 1
    const flashId = flashIdRef.current

    if (outcome === 'wrong') {
      voice.sound('boing')
      setWrongKey({ key: getExpectedChar(before) ?? ch, id: flashId })
      later(() => setWrongKey(w => (w?.id === flashId ? null : w)), WRONG_FLASH_MS)
      return
    }

    voice.note(ch)
    voice.sound('pop')
    setPressedKey({ key: ch, id: flashId })
    later(() => setPressedKey(p => (p?.id === flashId ? null : p)), PRESS_FLASH_MS)
    setBurst({ id: flashId, emoji: itemEmoji(item) })

    if (outcome === 'char') {
      voice.letter(ch)
      return
    }

    const { lastPraise, setLastPraise } = useLittleStore.getState()
    const praise = pickPraiseIndex(lastPraise, Math.random)
    setLastPraise(praise)
    voice.praise(praise, item.kind === 'word' ? item.target : ch.toUpperCase())
    voice.sound('sparkle')
    setPaused({ item, praise, stageUp: outcome === 'stage' || outcome === 'session' })

    if (outcome === 'session') {
      busyUntilRef.current = Number.POSITIVE_INFINITY
      later(() => voice.sound('fanfare'), 500)
      onFinish({ progress: state.progress, found: state.foundCount })
      return
    }

    const pause = outcome === 'stage' ? STAGE_PAUSE_MS : ITEM_PAUSE_MS
    busyUntilRef.current = now + pause
    later(() => {
      setPaused(null)
      lastActivityRef.current = performance.now()
      const next = getCurrentItem(gameRef.current)
      if (next) voice.prompt(next, false)
    }, pause)
  }, [voice, later, onFinish])

  const handleKeyRef = useRef(handleKey)
  handleKeyRef.current = handleKey

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      e.preventDefault()
      if (e.repeat) return
      const physical = /^Key[A-Z]$/.test(e.code) ? e.code.slice(3) : null
      const key = /^[a-zA-Z]$/.test(e.key) ? e.key : physical && !/^[ -~]$/.test(e.key) ? physical : e.key
      handleKeyRef.current(key)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      if (performance.now() < busyUntilRef.current) return
      const level = getHintLevel(performance.now() - lastActivityRef.current)
      setHint(prev => (prev === level ? prev : level))
      if (level > hintSpokenRef.current) {
        hintSpokenRef.current = level
        const current = getCurrentItem(gameRef.current)
        if (current) voice.prompt(current)
      }
    }, HINT_TICK_MS)
    return () => clearInterval(timer)
  }, [voice])

  const shownItem = paused?.item ?? getCurrentItem(game)
  const shownCharIndex = paused ? (shownItem?.target.length ?? 0) : game.charIndex
  const expected = paused ? null : getExpectedChar(game)

  let bubble = ''
  if (paused) {
    bubble = t(lang, `praise${paused.praise}` as TranslationKey)
  } else if (shownItem?.kind === 'letter') {
    bubble = `${t(lang, 'littleFindLetter')} ${shownItem.target.toUpperCase()}!`
  } else if (shownItem?.kind === 'word') {
    bubble = `${t(lang, 'littleTypeWord')} ${shownItem.target.toUpperCase()}!`
  }

  return (
    <div className="little-screen little-play">
      <header className="little-top">
        <button type="button" tabIndex={-1} className="little-chip" aria-label={t(lang, 'littleHome')} onClick={() => onExit(gameRef.current.progress)}>
          🏠
        </button>
        <StagePath stageIndex={game.stageIndex} itemIndex={game.itemIndex} finished={game.finished} stageItems={game.session.stages[game.stageIndex]?.length ?? 0} />
        <span className="little-top-spacer" />
      </header>

      <Mascot mood={paused ? 'happy' : hint > 0 ? 'wave' : 'idle'} bubbleKey={bubble}>
        {bubble}
      </Mascot>

      <div className="little-card-wrap">
        {shownItem && <ItemCard item={shownItem} charIndex={shownCharIndex} done={!!paused} />}
        <Burst id={burst.id} emoji={burst.emoji} big={!!paused?.stageUp} />
      </div>

      <BigKeyboard target={expected} hintLevel={paused ? 0 : hint} wrongKey={wrongKey} pressedKey={pressedKey} onPress={handleKey} />
    </div>
  )
}

function StagePath({ stageIndex, itemIndex, finished, stageItems }: { stageIndex: number; itemIndex: number; finished: boolean; stageItems: number }) {
  return (
    <div className="little-path" aria-hidden>
      {Array.from({ length: STAGE_COUNT }, (_, s) => {
        const done = finished || s < stageIndex
        const current = !finished && s === stageIndex
        const icon = done ? '⭐' : s === STAGE_COUNT - 1 ? '🎁' : String(s + 1)
        return (
          <div key={s} className="little-path-step">
            {s > 0 && <span className={`little-path-line ${done || current ? 'little-path-line--on' : ''}`} />}
            <div className={`little-path-dot ${done ? 'little-path-dot--done' : ''} ${current ? 'little-path-dot--now' : ''}`}>
              {icon}
              {current && (
                <span className="little-pips">
                  {Array.from({ length: stageItems }, (_, i) => (
                    <i key={i} className={i < itemIndex ? 'on' : ''} />
                  ))}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ItemCard({ item, charIndex, done }: { item: LittleItem; charIndex: number; done: boolean }) {
  if (item.kind === 'letter') {
    const { card } = item
    return (
      <div className={`little-card ${done ? 'little-card--done' : ''}`}>
        <div className="little-card-pic">{card.emoji}</div>
        <div className="little-card-letter">
          {card.letter.toUpperCase()}
          <small>{card.letter}</small>
        </div>
        <div className="little-card-word">
          {[...card.word].map((ch, i) => (
            <span key={i} className={ch === card.letter ? 'hl' : ''}>{ch === ' ' ? ' ' : ch.toUpperCase()}</span>
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className={`little-card little-card--word ${done ? 'little-card--done' : ''}`}>
      <div className="little-card-pic">{item.picture.emoji}</div>
      <div className="little-tiles">
        {[...item.target].map((ch, i) => (
          <span key={i} className={`little-tile ${i < charIndex ? 'little-tile--done' : ''} ${i === charIndex && !done ? 'little-tile--now' : ''}`}>
            {ch.toUpperCase()}
          </span>
        ))}
      </div>
    </div>
  )
}
