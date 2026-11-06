import type { CanvasBurst } from './budget'
import type { EffectsLevel } from './levels'
import type { Rng } from './rng'

export type CanvasSlot = 'confetti' | 'fireworks'

export type ConfettiFire = ((opts: Record<string, unknown>) => unknown) & { reset: () => void }

export interface ConfettiModule {
  create: (
    canvas: HTMLCanvasElement,
    opts?: { resize?: boolean; useWorker?: boolean },
  ) => ConfettiFire
  shapeFromPath?: (p: { path: string }) => unknown
}

interface DocLike {
  visibilityState: DocumentVisibilityState
  addEventListener: (type: 'visibilitychange', h: () => void) => void
  removeEventListener: (type: 'visibilitychange', h: () => void) => void
}

interface ControllerDeps {
  loader: () => Promise<ConfettiModule>
  doc?: DocLike
  schedule?: (fn: () => void, ms: number) => unknown
  rng?: Rng
}

export interface FireOptions {
  x: number
  y: number
}

export const CANVAS_LIFE_MS: Record<CanvasSlot, number> = { confetti: 1000, fireworks: 2400 }

const PATHS: Record<string, string> = {
  heart: 'M10 18 L2 9.5 A4.5 4.5 0 0 1 10 4 A4.5 4.5 0 0 1 18 9.5 Z',
  sparkle: 'M10 0 L12.5 7.5 L20 10 L12.5 12.5 L10 20 L7.5 12.5 L0 10 L7.5 7.5 Z',
}

export function createCanvasController({
  loader,
  doc,
  schedule = (fn, ms) => setTimeout(fn, ms),
  rng = Math.random,
}: ControllerDeps) {
  let mod: ConfettiModule | null = null
  let loading: Promise<void> | null = null
  let level: EffectsLevel = 'lots'
  let current: CanvasSlot | null = null
  let gen = 0
  let colors: string[] = []
  const canvases = new Map<CanvasSlot, HTMLCanvasElement>()
  const instances = new Map<CanvasSlot, ConfettiFire>()
  const shapes = new Map<string, unknown>()

  const mark = () => {
    for (const [slot, c] of canvases) c.dataset.active = slot === current ? 'true' : 'false'
  }

  const ensure = (slot: CanvasSlot): ConfettiFire | null => {
    const have = instances.get(slot)
    if (have) return have
    const c = canvases.get(slot)
    if (!mod || !c) return null
    const inst = mod.create(c, { resize: true, useWorker: false })
    instances.set(slot, inst)
    return inst
  }

  const shape = (name: string): unknown => {
    if (name === 'star') return 'star'
    if (name === 'dot' || name === 'peony' || name === 'ring') return 'circle'
    const path = PATHS[name]
    if (!path || !mod?.shapeFromPath) return 'star'
    if (!shapes.has(name)) shapes.set(name, mod.shapeFromPath({ path }))
    return shapes.get(name)
  }

  const reset = () => {
    gen += 1
    for (const inst of instances.values()) inst.reset()
    current = null
    mark()
  }

  const onVisibility = () => {
    if (doc?.visibilityState === 'hidden') reset()
  }
  doc?.addEventListener('visibilitychange', onVisibility)

  const confettiOpts = (b: CanvasBurst, origin: FireOptions) => ({
    particleCount: b.count,
    angle: 90 + (rng() * 70 - 35),
    spread: 50,
    startVelocity: 34,
    gravity: 0.6,
    ticks: 90,
    decay: 0.92,
    scalar: 0.9,
    origin: { x: origin.x, y: origin.y },
    shapes: [shape(String(b.shape))],
    colors: colors.length ? colors : undefined,
    disableForReducedMotion: true,
  })

  const fireworkOpts = (b: CanvasBurst) => ({
    particleCount: b.count,
    angle: 90,
    spread: 360,
    startVelocity: b.shape === 'ring' ? 18 : 22,
    gravity: 0.8,
    ticks: 90,
    decay: b.shape === 'ring' ? 0.94 : 0.91,
    scalar: 0.9,
    origin: { x: b.x, y: b.y },
    shapes: [shape(String(b.shape))],
    colors: colors.length ? colors : undefined,
    disableForReducedMotion: true,
  })

  return {
    prefetch(): Promise<void> {
      if (!loading) {
        loading = loader().then(
          (m) => {
            mod = m
            for (const slot of canvases.keys()) ensure(slot)
          },
          () => {
            loading = null
          },
        )
      }
      return loading ?? Promise.resolve()
    },
    attach(slot: CanvasSlot, canvas: HTMLCanvasElement) {
      if (canvases.get(slot) !== canvas) {
        instances.get(slot)?.reset()
        instances.delete(slot)
      }
      canvases.set(slot, canvas)
      canvas.dataset.active = current === slot ? 'true' : 'false'
      ensure(slot)
      return () => {
        if (canvases.get(slot) !== canvas) return
        instances.get(slot)?.reset()
        instances.delete(slot)
        canvases.delete(slot)
        if (current === slot) current = null
      }
    },
    setLevel(next: EffectsLevel) {
      level = next
      if (next === 'few') reset()
    },
    setColors(next: string[]) {
      colors = next.filter(Boolean)
    },
    fire(slot: CanvasSlot, plan: { bursts: CanvasBurst[] }, origin?: FireOptions): boolean {
      if (level === 'few') return false
      if (doc?.visibilityState === 'hidden') return false
      if (slot === 'fireworks' && level !== 'lots') return false
      const inst = ensure(slot)
      if (!inst) return false
      reset()
      const my = gen
      current = slot
      mark()
      let budget = 200
      plan.bursts.forEach((b, i) => {
        const count = Math.min(b.count, budget)
        budget -= count
        if (count <= 0) return
        const burst = { ...b, count }
        const run = () => {
          if (gen !== my) return
          inst(slot === 'confetti' ? confettiOpts(burst, origin ?? b) : fireworkOpts(burst))
        }
        if (i === 0) run()
        else schedule(run, i * 150)
      })
      setTimeout(() => {
        if (gen !== my) return
        current = null
        mark()
      }, CANVAS_LIFE_MS[slot])
      return true
    },
    reset,
    active(): CanvasSlot | null {
      return current
    },
    dispose() {
      doc?.removeEventListener('visibilitychange', onVisibility)
      reset()
    },
  }
}

export type CanvasController = ReturnType<typeof createCanvasController>

let shared: CanvasController | null = null

export function fxCanvas(): CanvasController {
  if (!shared) {
    shared = createCanvasController({
      loader: () => import('canvas-confetti').then((m) => m.default as unknown as ConfettiModule),
      doc: typeof document === 'undefined' ? undefined : document,
    })
  }
  return shared
}
