'use client'

import { useRef, useCallback, useEffect } from 'react'
import { SpeechEngine } from '@/lib/audio/speech-engine'
import { useSettingsStore } from '@/stores/settings-store'

export function useSpeech() {
  const engineRef = useRef<SpeechEngine | null>(null)
  const speechRate = useSettingsStore(s => s.speechRate)

  const getEngine = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = new SpeechEngine()
    }
    return engineRef.current
  }, [])

  useEffect(() => {
    getEngine().setRate(speechRate)
  }, [speechRate, getEngine])

  const speakLetter = useCallback((char: string) => {
    getEngine().speakLetter(char)
  }, [getEngine])

  const speakWord = useCallback((word: string) => {
    getEngine().speakWord(word)
  }, [getEngine])

  const cancel = useCallback(() => {
    getEngine().cancel()
  }, [getEngine])

  return { speakLetter, speakWord, cancel }
}
