'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { canStartLittleSession, newlyReachedIsland } from '@typing-adventure/game-engine'
import type { Island, LetterProgress, Sticker } from '@typing-adventure/game-engine'
import { useLittleStore } from '@/stores/little-store'
import { useLittleVoice } from '@/hooks/useLittleVoice'
import { localToday } from '@/lib/little/today'
import { LittleHome } from './LittleHome'
import { LittlePlay } from './LittlePlay'
import { LittleEnd } from './LittleEnd'
import { LittleAlbum } from './LittleAlbum'
import { LittleMap } from './LittleMap'
import { ParentPanel } from './ParentPanel'

type Screen = 'home' | 'play' | 'end' | 'album' | 'map' | 'parent'

export type PetEvent = 'hatched' | 'grew' | null

interface RoundResult {
  sticker: Sticker
  found: number
  island: Island | null
  petEvent: PetEvent
}

const END_DELAY_MS = 1800
const DAY_CHECK_MS = 30000

export function LittleMode() {
  const voice = useLittleVoice()
  const daily = useLittleStore(s => s.daily)
  const dailyLimit = useLittleStore(s => s.dailyLimit)
  const stickers = useLittleStore(s => s.stickers)
  const [screen, setScreen] = useState<Screen>('home')
  const [round, setRound] = useState(0)
  const [result, setResult] = useState<RoundResult | null>(null)
  const [, setTick] = useState(0)
  const endTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const bump = () => setTick(n => n + 1)
    const timer = setInterval(bump, DAY_CHECK_MS)
    document.addEventListener('visibilitychange', bump)
    window.addEventListener('focus', bump)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', bump)
      window.removeEventListener('focus', bump)
      if (endTimerRef.current) clearTimeout(endTimerRef.current)
    }
  }, [])

  const cancelEndTimer = useCallback(() => {
    if (endTimerRef.current) clearTimeout(endTimerRef.current)
    endTimerRef.current = null
  }, [])

  const canPlay = canStartLittleSession(daily, localToday(), dailyLimit)

  const startPlay = useCallback(() => {
    const store = useLittleStore.getState()
    const today = localToday()
    if (!canStartLittleSession(store.daily, today, store.dailyLimit)) return
    cancelEndTimer()
    voice.unlockAudio()
    setRound(r => r + 1)
    setScreen('play')
  }, [voice, cancelEndTimer])

  const handleFinish = useCallback(({ progress, found }: { progress: LetterProgress; found: number }) => {
    const store = useLittleStore.getState()
    const today = localToday()
    const island = newlyReachedIsland(store.progress, progress)
    store.commitProgress(progress)
    store.countSession(today)
    const sticker = store.addSticker()
    const fed = store.feedPet(today)
    const petEvent: PetEvent = fed.hatched ? 'hatched' : fed.grew ? 'grew' : null
    setResult({ sticker, found, island, petEvent })
    cancelEndTimer()
    endTimerRef.current = setTimeout(() => {
      endTimerRef.current = null
      setScreen('end')
    }, END_DELAY_MS)
  }, [cancelEndTimer])

  const handleExit = useCallback((progress: LetterProgress) => {
    useLittleStore.getState().commitProgress(progress)
    cancelEndTimer()
    voice.stop()
    setScreen('home')
  }, [voice, cancelEndTimer])

  const handleBonusPlay = useCallback(() => {
    useLittleStore.getState().grantBonus(localToday())
    startPlay()
  }, [startPlay])

  const goHome = useCallback(() => {
    voice.stop()
    setScreen('home')
  }, [voice])

  return (
    <div className="little-root">
      {screen === 'home' && (
        <LittleHome
          voice={voice}
          canPlay={canPlay}
          onPlay={startPlay}
          onAlbum={() => setScreen('album')}
          onMap={() => setScreen('map')}
          onParent={() => setScreen('parent')}
        />
      )}
      {screen === 'play' && (
        <LittlePlay key={round} voice={voice} onFinish={handleFinish} onExit={handleExit} />
      )}
      {screen === 'end' && result && (
        <LittleEnd
          voice={voice}
          sticker={result.sticker}
          found={result.found}
          island={result.island}
          petEvent={result.petEvent}
          collected={stickers}
          canPlayMore={canPlay}
          onPlayMore={startPlay}
          onBonusPlay={handleBonusPlay}
          onAlbum={() => setScreen('album')}
          onHome={goHome}
        />
      )}
      {screen === 'album' && <LittleAlbum voice={voice} collected={stickers} onHome={goHome} />}
      {screen === 'map' && <LittleMap voice={voice} onHome={goHome} />}
      {screen === 'parent' && <ParentPanel voice={voice} onClose={goHome} />}
    </div>
  )
}
