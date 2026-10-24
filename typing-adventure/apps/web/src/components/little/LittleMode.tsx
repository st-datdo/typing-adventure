'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { canStartLittleSession } from '@typing-adventure/game-engine'
import type { LetterProgress, Sticker } from '@typing-adventure/game-engine'
import { useLittleStore } from '@/stores/little-store'
import { useLittleVoice } from '@/hooks/useLittleVoice'
import { localToday } from '@/lib/little/today'
import { LittleHome } from './LittleHome'
import { LittlePlay } from './LittlePlay'
import { LittleEnd } from './LittleEnd'
import { LittleAlbum } from './LittleAlbum'
import { ParentPanel } from './ParentPanel'

type Screen = 'home' | 'play' | 'end' | 'album' | 'parent'

const END_DELAY_MS = 1800
const DAY_CHECK_MS = 30000

export function LittleMode() {
  const voice = useLittleVoice()
  const daily = useLittleStore(s => s.daily)
  const dailyLimit = useLittleStore(s => s.dailyLimit)
  const stickers = useLittleStore(s => s.stickers)
  const [screen, setScreen] = useState<Screen>('home')
  const [round, setRound] = useState(0)
  const [result, setResult] = useState<{ sticker: Sticker; found: number } | null>(null)
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
    store.commitProgress(progress)
    store.countSession(localToday())
    const sticker = store.addSticker()
    setResult({ sticker, found })
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
          collected={stickers}
          canPlayMore={canPlay}
          onPlayMore={startPlay}
          onBonusPlay={handleBonusPlay}
          onAlbum={() => setScreen('album')}
          onHome={goHome}
        />
      )}
      {screen === 'album' && <LittleAlbum voice={voice} collected={stickers} onHome={goHome} />}
      {screen === 'parent' && <ParentPanel voice={voice} onClose={goHome} />}
    </div>
  )
}
