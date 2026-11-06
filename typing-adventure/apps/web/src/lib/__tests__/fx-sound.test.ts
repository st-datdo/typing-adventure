import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { SoundEngine, type SoundType } from '../audio/sound-engine'

interface Log {
  freqs: number[]
  gains: number[]
  oscillators: number
}

function fakeContext(log: Log) {
  const param = (sink: number[]) => ({
    setValueAtTime: (v: number) => sink.push(v),
    exponentialRampToValueAtTime: (v: number) => sink.push(v),
    linearRampToValueAtTime: (v: number) => sink.push(v),
  })
  return class FakeAudioContext {
    currentTime = 0
    state = 'running'
    destination = {}
    resume() {
      return Promise.resolve()
    }
    createOscillator() {
      log.oscillators++
      return {
        type: 'sine',
        frequency: param(log.freqs),
        connect: () => {},
        start: () => {},
        stop: () => {},
      }
    }
    createGain() {
      return { gain: param(log.gains), connect: () => {} }
    }
  }
}

let log: Log
const g = globalThis as unknown as { window?: unknown }
let prevWindow: unknown

beforeEach(() => {
  log = { freqs: [], gains: [], oscillators: 0 }
  prevWindow = g.window
  g.window = { AudioContext: fakeContext(log) }
})

afterEach(() => {
  g.window = prevWindow
})

function engine(enabled = true) {
  const e = new SoundEngine()
  e.init()
  e.enabled = enabled
  return e
}

const peak = () => Math.max(...log.gains)

describe('FX sound', () => {
  it('FX-09 playStep uses the pentatonic scale', () => {
    const e = engine()
    e.playStep(0)
    expect(log.freqs[0]).toBeCloseTo(523.25)
    log.freqs = []
    e.playStep(9)
    expect(log.freqs[0]).toBeCloseTo(1760)
    log.freqs = []
    e.playStep(12)
    expect(log.freqs[0]).toBeCloseTo(1760)
    log.freqs = []
    e.playStep(-3)
    expect(log.freqs[0]).toBeCloseTo(523.25)
  })

  it('FX-09 gain ceiling: every step and tier sound peaks at or below correct', () => {
    const e = engine()
    e.play('correct')
    const ceiling = peak()
    expect(ceiling).toBeCloseTo(0.12)
    for (let s = 0; s <= 9; s++) {
      log.gains = []
      e.playStep(s)
      expect(peak(), `step ${s}`).toBeLessThanOrEqual(ceiling)
    }
    for (const type of ['pop', 'boing', 'sparkle', 'fanfare', 'sticker'] as SoundType[]) {
      log.gains = []
      e.play(type)
      expect(peak(), type).toBeLessThanOrEqual(ceiling)
    }
  })

  it('FX-09 disabled plays nothing', () => {
    const e = engine(false)
    e.playStep(3)
    e.play('sparkle')
    expect(log.oscillators).toBe(0)
  })
})
