'use client'

import { useRef, useCallback, useEffect } from 'react'
import { SoundEngine } from '@/lib/audio/sound-engine'
import type { SoundType } from '@/lib/audio/sound-engine'
import { useSettingsStore } from '@/stores/settings-store'

export function useSound() {
  const engineRef = useRef<SoundEngine | null>(null)
  const soundEnabled = useSettingsStore((s) => s.soundEnabled)

  const getEngine = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = new SoundEngine()
    }
    engineRef.current.enabled = soundEnabled
    return engineRef.current
  }, [soundEnabled])

  useEffect(() => {
    if (!soundEnabled) return
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
      cancelIdleCallback?: (id: number) => void
    }
    const warm = () => {
      try {
        getEngine().prepare()
      } catch {}
    }
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(warm, { timeout: 1500 })
      return () => w.cancelIdleCallback?.(id)
    }
    const id = window.setTimeout(warm, 300)
    return () => window.clearTimeout(id)
  }, [soundEnabled, getEngine])

  const play = useCallback(
    (type: SoundType) => {
      const engine = getEngine()
      if (!engine.enabled) return
      engine.init()
      engine.play(type)
    },
    [getEngine],
  )

  const playStep = useCallback(
    (step: number) => {
      const engine = getEngine()
      if (!engine.enabled) return
      engine.init()
      engine.playStep(step)
    },
    [getEngine],
  )

  const playCorrect = useCallback(() => play('correct'), [play])
  const playWrong = useCallback(() => play('wrong'), [play])
  const playComplete = useCallback(() => play('complete'), [play])
  const playClick = useCallback(() => play('click'), [play])

  return { play, playStep, playCorrect, playWrong, playComplete, playClick }
}
