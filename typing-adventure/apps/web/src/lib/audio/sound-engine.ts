export type SoundType =
  | 'correct'
  | 'wrong'
  | 'complete'
  | 'click'
  | 'pop'
  | 'boing'
  | 'sparkle'
  | 'fanfare'
  | 'sticker'

const PENTATONIC = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760]

interface ToneOptions {
  freq: number
  start?: number
  duration: number
  type?: OscillatorType
  gain?: number
  endFreq?: number
  attack?: number
}

export class SoundEngine {
  enabled: boolean = true
  private ctx: AudioContext | null = null

  init(): void {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)()
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
  }

  private tone({ freq, start = 0, duration, type = 'sine', gain = 0.1, endFreq, attack = 0.005 }: ToneOptions): void {
    if (!this.ctx) return
    const t0 = this.ctx.currentTime + start
    const osc = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    osc.connect(g)
    g.connect(this.ctx.destination)
    osc.type = type
    osc.frequency.setValueAtTime(freq, t0)
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t0 + duration)
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(gain, t0 + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
    osc.start(t0)
    osc.stop(t0 + duration + 0.02)
  }

  playNote(letter: string): void {
    if (!this.enabled || !this.ctx) return
    const code = letter.toLowerCase().charCodeAt(0) - 97
    if (code < 0 || code > 25) return
    const freq = PENTATONIC[code % PENTATONIC.length]
    this.tone({ freq, duration: 0.4, type: 'triangle', gain: 0.14, attack: 0.01 })
    this.tone({ freq: freq * 2, duration: 0.25, type: 'sine', gain: 0.03, attack: 0.01 })
  }

  play(type: SoundType): void {
    if (!this.enabled || !this.ctx) return

    switch (type) {
      case 'correct':
        this.tone({ freq: 880, endFreq: 1320, duration: 0.15, gain: 0.12 })
        return
      case 'wrong':
        this.tone({ freq: 330, endFreq: 260, duration: 0.15, type: 'triangle', gain: 0.05 })
        return
      case 'click':
        this.tone({ freq: 600, duration: 0.05, type: 'triangle', gain: 0.05 })
        return
      case 'complete':
        ;[523, 659, 784, 1047].forEach((freq, i) => {
          this.tone({ freq, start: i * 0.1, duration: 0.3, gain: 0.12 })
        })
        return
      case 'pop':
        this.tone({ freq: 500, endFreq: 950, duration: 0.09, gain: 0.1 })
        return
      case 'boing':
        this.tone({ freq: 420, endFreq: 210, duration: 0.18, gain: 0.07 })
        this.tone({ freq: 300, endFreq: 240, start: 0.16, duration: 0.12, gain: 0.04 })
        return
      case 'sparkle':
        ;[1318.51, 1567.98, 2093].forEach((freq, i) => {
          this.tone({ freq, start: i * 0.06, duration: 0.18, type: 'triangle', gain: 0.06 })
        })
        return
      case 'fanfare':
        ;[523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          this.tone({ freq, start: i * 0.12, duration: 0.25, type: 'triangle', gain: 0.12 })
        })
        ;[523.25, 659.25, 783.99, 1046.5].forEach((freq) => {
          this.tone({ freq, start: 0.5, duration: 0.8, type: 'sine', gain: 0.06, attack: 0.03 })
        })
        return
      case 'sticker':
        this.tone({ freq: 400, endFreq: 1200, duration: 0.3, gain: 0.08 })
        ;[1568, 2093].forEach((freq, i) => {
          this.tone({ freq, start: 0.3 + i * 0.08, duration: 0.2, type: 'triangle', gain: 0.06 })
        })
        return
    }
  }

  toggle(): boolean {
    this.enabled = !this.enabled
    return this.enabled
  }
}
