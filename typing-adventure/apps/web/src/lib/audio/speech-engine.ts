import type { SpeechRate } from '@typing-adventure/game-engine'

const RATES: Record<SpeechRate, number> = {
  slow: 0.6,
  normal: 0.85,
  fast: 1.1,
}

export class SpeechEngine {
  private synth: SpeechSynthesis
  private rate: number = 0.85
  private voice: SpeechSynthesisVoice | null = null

  constructor() {
    this.synth = window.speechSynthesis
    this.loadVoice()
  }

  private loadVoice(): void {
    const pickVoice = () => {
      const voices = this.synth.getVoices()
      this.voice =
        voices.find(v => v.lang.startsWith('en') && v.localService) ??
        voices.find(v => v.lang.startsWith('en')) ??
        voices[0] ?? null
    }
    pickVoice()
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = pickVoice
    }
  }

  private speak(text: string): void {
    if (!this.synth) return
    this.synth.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = this.rate
    utterance.pitch = 1.1
    if (this.voice) utterance.voice = this.voice
    utterance.lang = 'en-US'
    this.synth.speak(utterance)
  }

  speakLetter(char: string): void {
    this.speak(char === ' ' ? 'space' : char)
  }

  speakWord(word: string): void {
    this.speak(word)
  }

  setRate(preset: SpeechRate): void {
    this.rate = RATES[preset] ?? 0.85
  }

  cancel(): void {
    this.synth?.cancel()
  }
}
