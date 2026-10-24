'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { SoundEngine } from '@/lib/audio/sound-engine'
import type { SoundType } from '@/lib/audio/sound-engine'
import { SpeechEngine } from '@/lib/audio/speech-engine'
import type { SpeechPart } from '@/lib/audio/speech-engine'
import { useSettingsStore } from '@/stores/settings-store'
import { t, tReplace } from '@typing-adventure/i18n'
import type { TranslationKey } from '@typing-adventure/i18n'
import type { LittleItem } from '@typing-adventure/game-engine'

const BOING_GAP_MS = 250

let sharedSound: SoundEngine | null = null
let sharedSpeech: SpeechEngine | null = null

function getSound(): SoundEngine {
  if (!sharedSound) sharedSound = new SoundEngine()
  return sharedSound
}

function getSpeech(): SpeechEngine {
  if (!sharedSpeech) sharedSpeech = new SpeechEngine()
  return sharedSpeech
}

export function useLittleVoice() {
  const lang = useSettingsStore(s => s.lang)
  const soundEnabled = useSettingsStore(s => s.soundEnabled)
  const speechRate = useSettingsStore(s => s.speechRate)
  const lastBoingRef = useRef(0)

  useEffect(() => {
    getSpeech().setRate(speechRate)
  }, [speechRate])

  useEffect(() => {
    getSound().enabled = soundEnabled
    if (!soundEnabled) getSpeech().cancel()
  }, [soundEnabled])

  const say = useCallback((parts: SpeechPart[], interrupt = true) => {
    if (!soundEnabled) return
    getSpeech().speakSequence(parts, interrupt)
  }, [soundEnabled])

  const sound = useCallback((type: SoundType) => {
    const engine = getSound()
    engine.init()
    if (type === 'boing') {
      const now = performance.now()
      if (now - lastBoingRef.current < BOING_GAP_MS) return
      lastBoingRef.current = now
    }
    engine.play(type)
  }, [])

  const note = useCallback((ch: string) => {
    const engine = getSound()
    engine.init()
    engine.playNote(ch)
  }, [])

  const line = useCallback((key: TranslationKey): SpeechPart => ({ text: t(lang, key), lang }), [lang])

  const prompt = useCallback((item: LittleItem, interrupt = true) => {
    if (item.kind === 'letter') {
      const upper = item.target.toUpperCase()
      say([line('littleFindLetter'), { text: `${upper}! ${upper} for ${item.card.word}.`, lang: 'en' }], interrupt)
    } else {
      say([line('littleTypeWord'), { text: item.target, lang: 'en' }], interrupt)
    }
  }, [say, line])

  return useMemo(() => ({
    sound,
    note,
    prompt,
    letter: (ch: string) => say([{ text: ch.toUpperCase(), lang: 'en' }]),
    word: (w: string, then?: TranslationKey) =>
      say(then ? [{ text: w, lang: 'en' }, line(then)] : [{ text: w, lang: 'en' }]),
    praise: (i: number, before?: string) =>
      say(before ? [{ text: before, lang: 'en' }, line(`praise${i}` as TranslationKey)] : [line(`praise${i}` as TranslationKey)]),
    stickerName: (name: string) => say([{ text: name, lang: 'en' }]),
    hello: () => say([line('littleHello')]),
    sleep: (interrupt = true) => say([line('littleSleep')], interrupt),
    done: (n: number) => say([{ text: tReplace(lang, 'littleDone', n), lang }, line('littleNewSticker')]),
    testVoice: () => say([line('littleHello'), { text: 'A! A for apple.', lang: 'en' }]),
    hasViVoice: () => getSpeech().hasVoice('vi'),
    unlockAudio: () => getSound().init(),
    stop: () => getSpeech().cancel(),
  }), [sound, note, prompt, say, line, lang])
}

export type LittleVoice = ReturnType<typeof useLittleVoice>
