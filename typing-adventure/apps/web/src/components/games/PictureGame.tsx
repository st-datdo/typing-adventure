'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createPictureGame,
  getPictureWord,
  pickPraiseIndex,
  pictureKeypress,
  pictureStars,
  shouldShowPictureHint,
} from '@typing-adventure/game-engine'
import type { PictureGameState, PictureWord } from '@typing-adventure/game-engine'
import { t, tReplace } from '@typing-adventure/i18n'
import type { TranslationKey } from '@typing-adventure/i18n'
import { useSettingsStore } from '@/stores/settings-store'
import { useGamesStore } from '@/stores/games-store'
import { useLetterKeys } from '@/hooks/useLetterKeys'
import type { LittleVoice } from '@/hooks/useLittleVoice'
import { BigKeyboard } from '@/components/little/BigKeyboard'
import { Mascot } from '@/components/little/Mascot'
import { Burst } from '@/components/little/Burst'
import { Stars } from './Stars'

const WORD_PAUSE_MS = 1500
const HINT_TICK_MS = 250
const FLASH_MS = 400

interface PictureGameProps {
  voice: LittleVoice
  onBack: () => void
}

type Phase = 'intro' | 'play' | 'end'

interface Solved {
  word: PictureWord
  praise: number
}

export function PictureGame({ voice, onBack }: PictureGameProps) {
  const lang = useSettingsStore(s => s.lang)
  const [phase, setPhase] = useState<Phase>('intro')
  const [game, setGame] = useState<PictureGameState>(() => createPictureGame(Math.random))
  const [solved, setSolved] = useState<Solved | null>(null)
  const [hint, setHint] = useState(false)
  const [burst, setBurst] = useState({ id: 0, emoji: '✨' })
  const [wrong, setWrong] = useState<{ key: string; id: number } | null>(null)
  const [pressed, setPressed] = useState<{ key: string; id: number } | null>(null)
  const [result, setResult] = useState<{ stars: number; newBest: boolean } | null>(null)
  const gameRef = useRef(game)
  const busyRef = useRef(false)
  const lastActivityRef = useRef(0)
  const lastPraiseRef = useRef<number | null>(null)
  const flashRef = useRef(0)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const later = useCallback((fn: () => void, ms: number) => {
    timersRef.current.push(setTimeout(fn, ms))
  }, [])

  useEffect(() => {
    voice.lines(['gamePictureIntro'])
    return () => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
    }
  }, [voice])

  useEffect(() => {
    if (phase !== 'play') return
    const timer = setInterval(() => {
      if (busyRef.current) return
      const show = shouldShowPictureHint(gameRef.current, performance.now() - lastActivityRef.current)
      setHint(prev => (prev === show ? prev : show))
    }, HINT_TICK_MS)
    return () => clearInterval(timer)
  }, [phase])

  const start = () => {
    voice.unlockAudio()
    const fresh = createPictureGame(Math.random)
    gameRef.current = fresh
    busyRef.current = false
    lastActivityRef.current = performance.now()
    setGame(fresh)
    setSolved(null)
    setHint(false)
    setResult(null)
    setPhase('play')
    const first = getPictureWord(fresh)
    if (first) voice.word(first.word)
  }

  const handleKey = useCallback((key: string) => {
    if (phase !== 'play' || busyRef.current) return
    const before = gameRef.current
    const current = getPictureWord(before)
    const { state, outcome } = pictureKeypress(before, key)
    if (outcome === 'ignored' || !current) return
    gameRef.current = state
    setGame(state)
    lastActivityRef.current = performance.now()
    flashRef.current += 1
    const id = flashRef.current

    if (outcome === 'wrong') {
      voice.sound('boing')
      setWrong({ key: current.word[before.charIndex], id })
      later(() => setWrong(w => (w?.id === id ? null : w)), FLASH_MS)
      setHint(shouldShowPictureHint(state, 0))
      return
    }

    setHint(false)
    voice.note(key)
    voice.sound('pop')
    setPressed({ key, id })
    later(() => setPressed(p => (p?.id === id ? null : p)), FLASH_MS)
    if (outcome === 'char') return

    const praise = pickPraiseIndex(lastPraiseRef.current, Math.random)
    lastPraiseRef.current = praise
    voice.sound('sparkle')
    voice.praise(praise, current.word)
    setBurst({ id, emoji: current.emoji })
    setSolved({ word: current, praise })
    busyRef.current = true

    if (outcome === 'done') {
      const stars = pictureStars(state.firstTryWords, state.words.length)
      const { newBest } = useGamesStore.getState().recordResult('picture', stars)
      setResult({ stars, newBest })
      later(() => {
        setPhase('end')
        voice.sound('fanfare')
        voice.pictureResult(state.firstTryWords, state.words.length)
        if (newBest) voice.lines(['gameNewBest'], false)
      }, WORD_PAUSE_MS)
      return
    }

    later(() => {
      busyRef.current = false
      lastActivityRef.current = performance.now()
      setSolved(null)
      const next = getPictureWord(gameRef.current)
      if (next) voice.word(next.word, false)
    }, WORD_PAUSE_MS)
  }, [phase, voice, later])

  useLetterKeys(handleKey, phase === 'play')

  const current = solved?.word ?? getPictureWord(game)
  const typed = solved ? current?.word.length ?? 0 : game.charIndex
  const expected = !solved && current ? current.word[game.charIndex] : null

  return (
    <div className="little-screen games-play games-picture">
      <header className="little-top">
        <button type="button" className="little-chip" aria-label={t(lang, 'gameMenu')} onClick={onBack}>↩</button>
        <h1 className="little-title">🖼️ {t(lang, 'gamePicture')}</h1>
        <span className="games-counter">
          {Math.min(game.wordIndex + (solved ? 0 : 1), game.words.length)}/{game.words.length}
        </span>
      </header>

      {phase === 'intro' && (
        <div className="games-intro">
          <Mascot mood="wave">{t(lang, 'gamePictureIntro')}</Mascot>
          <button type="button" className="little-btn little-btn--go" onClick={start}>▶ {t(lang, 'gameStart')}</button>
        </div>
      )}

      {phase === 'play' && current && (
        <>
          {solved && (
            <Mascot mood="happy" bubbleKey={solved.word.word}>
              {t(lang, `praise${solved.praise}` as TranslationKey)}
            </Mascot>
          )}
          <div className="little-card-wrap">
            <div className={`little-card little-card--word ${solved ? 'little-card--done' : ''}`}>
              <div className="little-card-pic">{current.emoji}</div>
              <div className="little-tiles">
                {[...current.word].map((ch, i) => {
                  const done = i < typed
                  const now = i === typed && !solved
                  const cls = `little-tile ${done ? 'little-tile--done' : ''} ${now ? 'little-tile--now' : ''} ${now && hint ? 'games-tile--hint' : ''}`
                  return (
                    <span key={i} className={cls}>
                      {done || (now && hint) ? ch.toUpperCase() : ''}
                    </span>
                  )
                })}
              </div>
              <button
                type="button"
                className="little-btn little-btn--soft games-listen"
                onClick={() => {
                  lastActivityRef.current = performance.now()
                  voice.word(current.word)
                }}
              >
                🔊 {t(lang, 'gameListen')}
              </button>
            </div>
            <Burst id={burst.id} emoji={burst.emoji} />
          </div>
          <BigKeyboard target={hint ? expected : null} hintLevel={hint ? 1 : 0} wrongKey={hint ? wrong : null} pressedKey={pressed} onPress={handleKey} />
        </>
      )}

      {phase === 'end' && result && (
        <div className="games-end">
          <Mascot mood="happy">
            {tReplace(lang, 'gamePictureResult', game.firstTryWords, game.words.length)}
            {result.newBest && <><br />🏆 {t(lang, 'gameNewBest')}</>}
          </Mascot>
          <div className="games-end-stars"><Stars n={result.stars} /></div>
          <div className="games-end-words">
            {game.words.map(w => <span key={w.word} title={w.word}>{w.emoji}</span>)}
          </div>
          <div className="little-home-actions">
            <button type="button" className="little-btn little-btn--go" onClick={start}>🔁 {t(lang, 'gameAgain')}</button>
            <button type="button" className="little-btn little-btn--soft" onClick={onBack}>🎮 {t(lang, 'gameMenu')}</button>
          </div>
        </div>
      )}
    </div>
  )
}
