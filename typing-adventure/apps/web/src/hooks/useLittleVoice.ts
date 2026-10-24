'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { SoundEngine } from '@/lib/audio/sound-engine'
import type { SoundType } from '@/lib/audio/sound-engine'
import { VoiceEngine } from '@/lib/audio/voice-engine'
import type { SpeechPart } from '@/lib/audio/speech-engine'
import {
  balloonResultClip,
  cardClip,
  cardText,
  doneClip,
  letterClip,
  listVoiceClips,
  pictureResultClip,
  wordClip,
} from '@/lib/audio/voice-clips'
import type { VoiceLineKey } from '@/lib/audio/voice-clips'
import { useSettingsStore } from '@/stores/settings-store'
import { t, tReplace } from '@typing-adventure/i18n'
import type { LittleItem } from '@typing-adventure/game-engine'

const BOING_GAP_MS = 250

let sharedSound: SoundEngine | null = null
let sharedVoice: VoiceEngine | null = null

function getSound(): SoundEngine {
  if (!sharedSound) sharedSound = new SoundEngine()
  return sharedSound
}

function getVoice(): VoiceEngine {
  if (!sharedVoice) sharedVoice = new VoiceEngine()
  return sharedVoice
}

function enPart(text: string): SpeechPart {
  return { text, lang: 'en', clip: text.length === 1 ? letterClip(text.toLowerCase()) : wordClip(text) }
}

export function useLittleVoice() {
  const lang = useSettingsStore(s => s.lang)
  const soundEnabled = useSettingsStore(s => s.soundEnabled)
  const speechRate = useSettingsStore(s => s.speechRate)
  const lastBoingRef = useRef(0)

  useEffect(() => {
    getVoice().setRate(speechRate)
  }, [speechRate])

  useEffect(() => {
    getSound().enabled = soundEnabled
    if (!soundEnabled) getVoice().cancel()
  }, [soundEnabled])

  const say = useCallback((parts: SpeechPart[], interrupt = true) => {
    if (!soundEnabled) return
    getVoice().speak(parts, interrupt)
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

  const line = useCallback((key: VoiceLineKey): SpeechPart => ({ text: t(lang, key), lang, clip: key }), [lang])

  const prompt = useCallback((item: LittleItem, interrupt = true) => {
    if (item.kind === 'letter') {
      say([line('littleFindLetter'), { text: cardText(item.target), lang: 'en', clip: cardClip(item.target) }], interrupt)
    } else {
      say([line('littleTypeWord'), enPart(item.target)], interrupt)
    }
  }, [say, line])

  return useMemo(() => ({
    sound,
    note,
    prompt,
    say,
    lines: (keys: VoiceLineKey[], interrupt = true) => say(keys.map(line), interrupt),
    letter: (ch: string) => say([enPart(ch.toUpperCase())]),
    word: (w: string, interrupt = true) => say([enPart(w)], interrupt),
    praise: (i: number, before?: string) => {
      const praiseLine = line(`praise${i}` as VoiceLineKey)
      say(before ? [enPart(before), praiseLine] : [praiseLine])
    },
    stickerName: (name: string) => say([enPart(name)]),
    hello: () => say([line('littleHello')]),
    sleep: (interrupt = true) => say([line('littleSleep')], interrupt),
    done: (n: number) => say([
      { text: tReplace(lang, 'littleDone', n), lang, clip: doneClip(n) },
      line('littleNewSticker'),
    ]),
    balloonResult: (popped: number) => say([
      { text: tReplace(lang, 'gameBalloonResult', popped), lang, clip: balloonResultClip(popped) },
    ]),
    pictureResult: (firstTry: number, total: number) => say([
      { text: tReplace(lang, 'gamePictureResult', firstTry, total), lang, clip: pictureResultClip(firstTry, total) },
    ]),
    testVoice: () => say([line('littleHello'), { text: cardText('a'), lang: 'en', clip: cardClip('a') }]),
    hasViVoice: () => getVoice().hasVoice('vi'),
    clipStats: async () => {
      const voice = getVoice()
      await voice.whenReady()
      const all = listVoiceClips()
      return { have: voice.countClips(all), total: all.length }
    },
    unlockAudio: () => getSound().init(),
    stop: () => getVoice().cancel(),
  }), [sound, note, prompt, say, line, lang])
}

export type LittleVoice = ReturnType<typeof useLittleVoice>
