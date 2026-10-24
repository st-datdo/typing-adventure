'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { balloonStars, createBalloonGame, popBalloon, tickBalloons } from '@typing-adventure/game-engine'
import type { BalloonGameState } from '@typing-adventure/game-engine'
import { t, tReplace } from '@typing-adventure/i18n'
import { useSettingsStore } from '@/stores/settings-store'
import { useGamesStore } from '@/stores/games-store'
import { useLetterKeys } from '@/hooks/useLetterKeys'
import type { LittleVoice } from '@/hooks/useLittleVoice'
import { BigKeyboard } from '@/components/little/BigKeyboard'
import { Mascot } from '@/components/little/Mascot'
import { Stars } from './Stars'

const MAX_FRAME_MS = 100
const POP_EFFECT_MS = 500
const MISS_FLASH_MS = 400
const END_DELAY_MS = 700
const TRAVEL_PAD_PX = 130

function skyBottom(y: number): string {
  return `calc(${y} * (100% + ${TRAVEL_PAD_PX}px) - ${TRAVEL_PAD_PX}px)`
}

interface PopEffect {
  id: number
  x: number
  y: number
}

interface BalloonGameProps {
  voice: LittleVoice
  onBack: () => void
}

type Phase = 'intro' | 'play' | 'end'

export function BalloonGame({ voice, onBack }: BalloonGameProps) {
  const lang = useSettingsStore(s => s.lang)
  const [phase, setPhase] = useState<Phase>('intro')
  const [game, setGame] = useState<BalloonGameState>(() => createBalloonGame())
  const [pops, setPops] = useState<PopEffect[]>([])
  const [pressed, setPressed] = useState<{ key: string; id: number } | null>(null)
  const [missed, setMissed] = useState<{ key: string; id: number } | null>(null)
  const [result, setResult] = useState<{ stars: number; newBest: boolean } | null>(null)
  const gameRef = useRef(game)
  const flashRef = useRef(0)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const later = useCallback((fn: () => void, ms: number) => {
    timersRef.current.push(setTimeout(fn, ms))
  }, [])

  useEffect(() => {
    voice.lines(['gameBalloonIntro'])
    return () => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
    }
  }, [voice])

  const finish = useCallback((state: BalloonGameState) => {
    const stars = balloonStars(state.escaped)
    const { newBest } = useGamesStore.getState().recordResult('balloon', stars)
    setResult({ stars, newBest })
    later(() => {
      setPhase('end')
      voice.sound('fanfare')
      voice.balloonResult(state.popped)
      if (newBest) voice.lines(['gameNewBest'], false)
    }, END_DELAY_MS)
  }, [voice, later])

  useEffect(() => {
    if (phase !== 'play') return
    let frame = 0
    let last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min(MAX_FRAME_MS, now - last)
      last = now
      const next = tickBalloons(gameRef.current, dt, Math.random)
      if (next !== gameRef.current) {
        gameRef.current = next
        setGame(next)
      }
      if (!next.finished) frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [phase])

  const start = () => {
    voice.unlockAudio()
    voice.stop()
    const fresh = createBalloonGame()
    gameRef.current = fresh
    setGame(fresh)
    setPops([])
    setResult(null)
    setPhase('play')
  }

  const handleKey = useCallback((key: string) => {
    if (phase !== 'play') return
    const before = gameRef.current
    if (before.finished) return
    const { state, popped } = popBalloon(before, key)
    flashRef.current += 1
    const id = flashRef.current
    if (!popped) {
      voice.sound('boing')
      setMissed({ key, id })
      later(() => setMissed(m => (m?.id === id ? null : m)), MISS_FLASH_MS)
      return
    }
    gameRef.current = state
    setGame(state)
    voice.note(key)
    voice.sound('pop')
    setPressed({ key, id })
    later(() => setPressed(p => (p?.id === id ? null : p)), MISS_FLASH_MS)
    setPops(list => [...list, { id, x: popped.x, y: popped.y }])
    later(() => setPops(list => list.filter(p => p.id !== id)), POP_EFFECT_MS)
    if (state.finished) finish(state)
  }, [phase, voice, later, finish])

  useLetterKeys(handleKey, phase === 'play')

  return (
    <div className="little-screen games-play games-balloon">
      <header className="little-top">
        <button type="button" className="little-chip" aria-label={t(lang, 'gameMenu')} onClick={onBack}>↩</button>
        <h1 className="little-title">🎈 {t(lang, 'gameBalloon')}</h1>
        <span className="games-counter">{game.popped}/{game.target}</span>
      </header>

      {phase === 'intro' && (
        <div className="games-intro">
          <Mascot mood="wave">{t(lang, 'gameBalloonIntro')}</Mascot>
          <button type="button" className="little-btn little-btn--go" onClick={start}>▶ {t(lang, 'gameStart')}</button>
        </div>
      )}

      {phase === 'play' && (
        <>
          <div className="games-sky" aria-live="off">
            {game.balloons.map(b => (
              <div
                key={b.id}
                className={`games-balloon-item games-balloon-item--c${b.color}`}
                style={{ left: `${b.x * 100}%`, bottom: skyBottom(b.y) }}
              >
                <span>{b.letter.toUpperCase()}</span>
              </div>
            ))}
            {pops.map(p => (
              <div key={p.id} className="games-pop" style={{ left: `${p.x * 100}%`, bottom: skyBottom(p.y) }} aria-hidden>
                💥
              </div>
            ))}
          </div>
          <BigKeyboard target={null} hintLevel={0} wrongKey={missed} pressedKey={pressed} onPress={handleKey} />
        </>
      )}

      {phase === 'end' && result && (
        <div className="games-end">
          <Mascot mood="happy">
            {tReplace(lang, 'gameBalloonResult', game.popped)}
            {result.newBest && <><br />🏆 {t(lang, 'gameNewBest')}</>}
          </Mascot>
          <div className="games-end-stars"><Stars n={result.stars} /></div>
          <div className="little-home-actions">
            <button type="button" className="little-btn little-btn--go" onClick={start}>🔁 {t(lang, 'gameAgain')}</button>
            <button type="button" className="little-btn little-btn--soft" onClick={onBack}>🎮 {t(lang, 'gameMenu')}</button>
          </div>
        </div>
      )}
    </div>
  )
}
