export type SoundType = 'correct' | 'wrong' | 'complete' | 'click'

export class SoundEngine {
  enabled: boolean = true
  private ctx: AudioContext | null = null

  init(): void {
    if (this.ctx) return
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
  }

  play(type: SoundType): void {
    if (!this.enabled || !this.ctx) return
    const now = this.ctx.currentTime

    if (type === 'complete') {
      const freqs = [523, 659, 784, 1047]
      freqs.forEach((freq, i) => {
        const o = this.ctx!.createOscillator()
        const g = this.ctx!.createGain()
        o.connect(g)
        g.connect(this.ctx!.destination)
        o.type = 'sine'
        o.frequency.setValueAtTime(freq, now + i * 0.1)
        g.gain.setValueAtTime(0.12, now + i * 0.1)
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3)
        o.start(now + i * 0.1)
        o.stop(now + i * 0.1 + 0.3)
      })
      return
    }

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.connect(gain)
    gain.connect(this.ctx.destination)

    if (type === 'correct') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, now)
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.08)
      gain.gain.setValueAtTime(0.15, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
      osc.start(now)
      osc.stop(now + 0.15)
    } else if (type === 'wrong') {
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(200, now)
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.2)
      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
      osc.start(now)
      osc.stop(now + 0.25)
    } else {
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(600, now)
      gain.gain.setValueAtTime(0.06, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
      osc.start(now)
      osc.stop(now + 0.05)
    }
  }

  toggle(): boolean {
    this.enabled = !this.enabled
    return this.enabled
  }
}
