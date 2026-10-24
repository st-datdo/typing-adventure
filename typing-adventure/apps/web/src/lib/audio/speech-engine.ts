import type { SpeechRate } from '@typing-adventure/game-engine'

const RATES: Record<SpeechRate, number> = {
  slow: 0.6,
  normal: 0.85,
  fast: 1.1,
}

export type SpeechLang = 'vi' | 'en'

export interface SpeechPart {
  text: string
  lang: SpeechLang
  clip?: string
}

const SPEAK_TIMEOUT_BASE_MS = 2000
const SPEAK_TIMEOUT_PER_CHAR_MS = 200

const LANG_TAGS: Record<SpeechLang, string> = { vi: 'vi-VN', en: 'en-US' }

export class SpeechEngine {
  private synth: SpeechSynthesis | null
  private rate: number = 0.85
  private voices: Record<SpeechLang, SpeechSynthesisVoice | null> = { vi: null, en: null }

  constructor() {
    this.synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null
    this.loadVoices()
  }

  private loadVoices(): void {
    if (!this.synth) return
    const synth = this.synth
    const pick = (prefix: string) => {
      const voices = synth.getVoices()
      return (
        voices.find(v => v.lang.toLowerCase().startsWith(prefix) && v.localService) ??
        voices.find(v => v.lang.toLowerCase().startsWith(prefix)) ??
        null
      )
    }
    const pickAll = () => {
      this.voices = { vi: pick('vi'), en: pick('en') ?? synth.getVoices()[0] ?? null }
    }
    pickAll()
    synth.addEventListener?.('voiceschanged', pickAll)
  }

  hasVoice(lang: SpeechLang): boolean {
    return this.voices[lang] !== null
  }

  private utter(text: string, lang: SpeechLang): SpeechSynthesisUtterance {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = this.rate
    utterance.pitch = 1.1
    const voice = this.voices[lang]
    if (voice) utterance.voice = voice
    utterance.lang = LANG_TAGS[lang]
    return utterance
  }

  speakSequence(parts: SpeechPart[], interrupt = true): void {
    if (!this.synth) return
    if (interrupt) this.synth.cancel()
    for (const part of parts) {
      if (!part.text) continue
      if (part.lang === 'vi' && !this.hasVoice('vi')) continue
      this.synth.speak(this.utter(part.text, part.lang))
    }
  }

  speakAsync(part: SpeechPart): Promise<void> {
    const synth = this.synth
    if (!synth || !part.text || (part.lang === 'vi' && !this.hasVoice('vi'))) return Promise.resolve()
    return new Promise(resolve => {
      const utterance = this.utter(part.text, part.lang)
      const finish = () => {
        clearTimeout(timer)
        resolve()
      }
      const timer = setTimeout(finish, (SPEAK_TIMEOUT_BASE_MS + part.text.length * SPEAK_TIMEOUT_PER_CHAR_MS) / this.rate)
      utterance.onend = finish
      utterance.onerror = finish
      synth.speak(utterance)
    })
  }

  speakLetter(char: string): void {
    this.speakSequence([{ text: char === ' ' ? 'space' : char, lang: 'en' }])
  }

  speakWord(word: string): void {
    this.speakSequence([{ text: word, lang: 'en' }])
  }

  setRate(preset: SpeechRate): void {
    this.rate = RATES[preset] ?? 0.85
  }

  cancel(): void {
    this.synth?.cancel()
  }
}
