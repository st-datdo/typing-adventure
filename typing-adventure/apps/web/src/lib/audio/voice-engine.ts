import type { SpeechRate } from '@typing-adventure/game-engine'
import { SpeechEngine } from './speech-engine'
import type { SpeechLang, SpeechPart } from './speech-engine'

const MANIFEST_URL = '/voice/manifest.json'
const MANIFEST_WAIT_MS = 1500
const PLAYBACK_RATES: Record<SpeechRate, number> = { slow: 0.85, normal: 1, fast: 1.15 }

export type VoiceManifest = Partial<Record<SpeechLang, string[]>>

export class VoiceEngine {
  private speech = new SpeechEngine()
  private clips: Record<SpeechLang, Set<string>> = { vi: new Set(), en: new Set() }
  private failed = new Set<string>()
  private gen = 0
  private chain: Promise<void> = Promise.resolve()
  private stopCurrent: (() => void) | null = null
  private playbackRate = 1
  private ready: Promise<void>

  constructor() {
    this.ready = typeof window === 'undefined' ? Promise.resolve() : this.loadManifest()
  }

  private async loadManifest(): Promise<void> {
    const load = fetch(MANIFEST_URL, { cache: 'no-cache' })
      .then(res => (res.ok ? (res.json() as Promise<VoiceManifest>) : ({} as VoiceManifest)))
      .then((manifest: VoiceManifest) => {
        for (const lang of ['vi', 'en'] as const) {
          const ids = manifest[lang]
          if (Array.isArray(ids)) this.clips[lang] = new Set(ids.filter(id => typeof id === 'string'))
        }
      })
      .catch(() => {})
    const timeout = new Promise<void>(resolve => setTimeout(resolve, MANIFEST_WAIT_MS))
    await Promise.race([load, timeout])
  }

  whenReady(): Promise<void> {
    return this.ready
  }

  setRate(preset: SpeechRate): void {
    this.speech.setRate(preset)
    this.playbackRate = PLAYBACK_RATES[preset] ?? 1
  }

  hasVoice(lang: SpeechLang): boolean {
    return this.speech.hasVoice(lang)
  }

  hasClip(lang: SpeechLang, id: string): boolean {
    return this.clips[lang].has(id) && !this.failed.has(`${lang}/${id}`)
  }

  countClips(wanted: { lang: SpeechLang; id: string }[]): number {
    return wanted.filter(c => this.hasClip(c.lang, c.id)).length
  }

  speak(parts: SpeechPart[], interrupt = true): void {
    if (interrupt) this.cancel()
    const gen = this.gen
    this.chain = this.chain.then(async () => {
      await this.ready
      for (const part of parts) {
        if (gen !== this.gen) return
        await this.playPart(part)
      }
    })
  }

  cancel(): void {
    this.gen += 1
    this.stopCurrent?.()
    this.stopCurrent = null
    this.speech.cancel()
  }

  private async playPart(part: SpeechPart): Promise<void> {
    if (!part.text) return
    if (part.clip && this.hasClip(part.lang, part.clip)) {
      const played = await this.playClip(part.lang, part.clip)
      if (played) return
      this.failed.add(`${part.lang}/${part.clip}`)
    }
    await this.speech.speakAsync(part)
  }

  private playClip(lang: SpeechLang, id: string): Promise<boolean> {
    return new Promise(resolve => {
      const audio = new Audio(`/voice/${lang}/${encodeURIComponent(id)}.mp3`)
      audio.playbackRate = this.playbackRate
      let settled = false
      const finish = (ok: boolean) => {
        if (settled) return
        settled = true
        audio.onended = null
        audio.onerror = null
        if (this.stopCurrent === stop) this.stopCurrent = null
        resolve(ok)
      }
      const stop = () => {
        audio.pause()
        finish(true)
      }
      this.stopCurrent = stop
      audio.onended = () => finish(true)
      audio.onerror = () => finish(false)
      audio.play().catch(() => finish(false))
    })
  }
}
