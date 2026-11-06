import { describe, expect, it, vi } from 'vitest'
import { createCanvasController, type ConfettiModule } from '@/lib/fx/confetti'
import { canvasBurstPlan } from '@/lib/fx/budget'
import { mulberry32 } from '@/lib/fx/rng'

type Call = { canvas: string; opts: Record<string, unknown> }

function fakeModule() {
  const calls: Call[] = []
  const resets: string[] = []
  const mod: ConfettiModule = {
    create: (canvas) => {
      const name = (canvas as unknown as { id: string }).id
      const fire = ((opts: Record<string, unknown>) => {
        calls.push({ canvas: name, opts })
        return null
      }) as ReturnType<ConfettiModule['create']>
      fire.reset = () => {
        resets.push(name)
      }
      return fire
    },
  }
  return { mod, calls, resets }
}

function fakeDoc() {
  const handlers: Record<string, () => void> = {}
  const doc = {
    visibilityState: 'visible' as DocumentVisibilityState,
    addEventListener: (type: string, h: () => void) => {
      handlers[type] = h
    },
    removeEventListener: () => {},
  }
  return { doc, handlers }
}

function canvas(id: string) {
  return { id, dataset: {} as Record<string, string> } as unknown as HTMLCanvasElement
}

const schedule = (fn: () => void) => {
  fn()
  return 0
}

async function ready() {
  const f = fakeModule()
  const d = fakeDoc()
  const c = createCanvasController({
    loader: () => Promise.resolve(f.mod),
    doc: d.doc,
    schedule,
    rng: mulberry32(7),
  })
  await c.prefetch()
  const conf = canvas('confetti')
  const fw = canvas('fireworks')
  c.attach('confetti', conf)
  c.attach('fireworks', fw)
  return { ...f, ...d, c, conf, fw }
}

const confettiPlan = () => canvasBurstPlan('confetti', mulberry32(1))
const fireworksPlan = () => canvasBurstPlan('peony', mulberry32(2))

describe('fx canvas controller', () => {
  it('FX-17 single active: firing fireworks resets the confetti instance first', async () => {
    const { c, calls, resets, conf, fw } = await ready()
    expect(c.fire('confetti', confettiPlan(), { x: 0.5, y: 0.6 })).toBe(true)
    expect(c.active()).toBe('confetti')
    expect(conf.dataset.active).toBe('true')
    expect(c.fire('fireworks', fireworksPlan())).toBe(true)
    expect(resets).toContain('confetti')
    expect(c.active()).toBe('fireworks')
    expect(conf.dataset.active).toBe('false')
    expect(fw.dataset.active).toBe('true')
    expect(calls.some((x) => x.canvas === 'fireworks')).toBe(true)
  })

  it('FX-17 particle cap: every fire spends at most 200 particles', async () => {
    for (let seed = 1; seed < 40; seed++) {
      const { c, calls } = await ready()
      c.fire('fireworks', canvasBurstPlan('star', mulberry32(seed)))
      const sum = calls.reduce((s, x) => s + Number(x.opts.particleCount), 0)
      expect(sum).toBeLessThanOrEqual(200)
      expect(sum).toBeGreaterThan(0)
    }
  })

  it('FX-17 hidden tab resets every instance and blocks fire', async () => {
    const { c, doc, handlers, resets, conf } = await ready()
    c.fire('confetti', confettiPlan(), { x: 0.5, y: 0.5 })
    doc.visibilityState = 'hidden'
    handlers.visibilitychange()
    expect(resets).toEqual(expect.arrayContaining(['confetti', 'fireworks']))
    expect(c.active()).toBeNull()
    expect(conf.dataset.active).toBe('false')
    expect(c.fire('confetti', confettiPlan(), { x: 0.5, y: 0.5 })).toBe(false)
  })

  it('FX-15 reduced or few level makes fire a no-op', async () => {
    const { c, calls } = await ready()
    c.setLevel('few')
    expect(c.fire('confetti', confettiPlan(), { x: 0.5, y: 0.5 })).toBe(false)
    expect(c.fire('fireworks', fireworksPlan())).toBe(false)
    expect(calls).toEqual([])
  })

  it('loader not ready: fire returns false without throwing', () => {
    const c = createCanvasController({
      loader: () => new Promise<ConfettiModule>(() => {}),
      doc: fakeDoc().doc,
      schedule,
    })
    c.prefetch()
    c.attach('confetti', canvas('confetti'))
    expect(() => c.fire('confetti', confettiPlan(), { x: 0.5, y: 0.5 })).not.toThrow()
    expect(c.fire('confetti', confettiPlan(), { x: 0.5, y: 0.5 })).toBe(false)
  })

  it('FX-19 confetti options shoot upward from the char with low gravity and short life', async () => {
    const { c, calls } = await ready()
    c.fire('confetti', confettiPlan(), { x: 0.3, y: 0.55 })
    expect(calls).toHaveLength(1)
    const o = calls[0].opts
    expect(o.angle as number).toBeGreaterThanOrEqual(55)
    expect(o.angle as number).toBeLessThanOrEqual(125)
    expect(o.gravity as number).toBeLessThanOrEqual(0.8)
    expect(o.ticks as number).toBeLessThanOrEqual(100)
    expect(o.origin).toEqual({ x: 0.3, y: 0.55 })
  })

  it('FX-17 reset clears active state', async () => {
    const { c, conf } = await ready()
    c.fire('confetti', confettiPlan(), { x: 0.5, y: 0.5 })
    c.reset()
    expect(c.active()).toBeNull()
    expect(conf.dataset.active).toBe('false')
  })

  it('FX-17 active ends after the burst lifetime', async () => {
    vi.useFakeTimers()
    try {
      const f = fakeModule()
      const c = createCanvasController({
        loader: () => Promise.resolve(f.mod),
        doc: fakeDoc().doc,
      })
      await c.prefetch()
      const conf = canvas('confetti')
      c.attach('confetti', conf)
      c.fire('confetti', confettiPlan(), { x: 0.5, y: 0.5 })
      expect(conf.dataset.active).toBe('true')
      vi.advanceTimersByTime(2600)
      expect(conf.dataset.active).toBe('false')
      expect(c.active()).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })
})
