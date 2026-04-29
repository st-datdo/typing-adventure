'use client'

import { useRef, useCallback } from 'react'
import { SoundEngine } from '@/lib/audio/sound-engine'
import type { SoundType } from '@/lib/audio/sound-engine'
import { useSettingsStore } from '@/stores/settings-store'

export function useSound() {
  const engineRef = useRef<SoundEngine | null>(null)
  const soundEnabled = useSettingsStore(s => s.soundEnabled)

  const getEngine = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = new SoundEngine()
    }
    engineRef.current.enabled = soundEnabled
    return engineRef.current
  }, [soundEnabled])

  const play = useCallback((type: SoundType) => {
    const engine = getEngine()
    engine.init()
    engine.play(type)
  }, [getEngine])

  const playCorrect = useCallback(() => play('correct'), [play])
  const playWrong = useCallback(() => play('wrong'), [play])
  const playComplete = useCallback(() => play('complete'), [play])
  const playClick = useCallback(() => play('click'), [play])

  return { play, playCorrect, playWrong, playComplete, playClick }
}
