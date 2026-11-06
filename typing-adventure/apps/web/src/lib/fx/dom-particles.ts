import { allocateNodes, DOM_NODE_CAP } from './budget'
import type { ParticleShape } from './pools'
import type { Rng } from './rng'

export type ParticleKind = 'spark' | 'confetti'

export interface EmitOptions {
  kind: ParticleKind
  shapes: readonly ParticleShape[]
  count: number
  rng: Rng
  spreadX?: number
}

export interface ParticlePool {
  emit: (origin: { x: number; y: number }, opts: EmitOptions) => number
  alive: () => number
  clear: () => void
}

const COLORS = ['var(--kr-play)', 'var(--kr-fun)', 'var(--kr-primary)', 'var(--kr-success)']
const LIFE_MS: Record<ParticleKind, number> = { spark: 560, confetti: 600 }

let liveTotal = 0

export function liveParticleCount(): number {
  return liveTotal
}

export function createParticlePool(
  container: HTMLElement,
  svgFor: (shape: ParticleShape) => string,
  cap = DOM_NODE_CAP,
): ParticlePool {
  const doc = container.ownerDocument
  const free: HTMLElement[] = []
  const live = new Set<HTMLElement>()
  let colorIndex = 0

  const release = (node: HTMLElement) => {
    if (!live.delete(node)) return
    liveTotal = Math.max(0, liveTotal - 1)
    node.remove()
    free.push(node)
  }

  const emit = (origin: { x: number; y: number }, opts: EmitOptions) => {
    const n = allocateNodes(liveTotal, opts.count, cap)
    const { rng } = opts
    for (let i = 0; i < n; i++) {
      const node = free.pop() ?? doc.createElement('span')
      const shape = opts.shapes[i % opts.shapes.length]
      let angle: number
      let dist: number
      let x = origin.x
      if (opts.kind === 'spark') {
        angle = (-165 + rng() * 70) * (Math.PI / 180)
        dist = 22 + rng() * 22
        x += (rng() * 2 - 1) * 6
      } else {
        angle = (-150 + rng() * 120) * (Math.PI / 180)
        dist = 30 + rng() * 30
        x += (rng() - 0.5) * (opts.spreadX ?? 0)
      }
      const y = origin.y + (opts.kind === 'spark' ? (rng() * 2 - 1) * 6 : 0)
      const size = opts.kind === 'spark' ? 10 + rng() * 6 : 6 + rng() * 4
      node.className = `fx-p fx-p--${opts.kind}`
      node.setAttribute('aria-hidden', 'true')
      node.innerHTML = opts.kind === 'spark' ? svgFor(shape) : ''
      const s = node.style
      s.left = `${x.toFixed(1)}px`
      s.top = `${y.toFixed(1)}px`
      s.setProperty('--fx-size', `${size.toFixed(1)}px`)
      s.setProperty('--fx-dx', `${(Math.cos(angle) * dist).toFixed(1)}px`)
      s.setProperty('--fx-dy', `${(Math.sin(angle) * dist).toFixed(1)}px`)
      s.setProperty('--fx-rot', `${Math.round(rng() * 180)}deg`)
      s.setProperty('--fx-color', COLORS[colorIndex++ % COLORS.length])
      live.add(node)
      liveTotal++
      container.appendChild(node)
      const done = () => release(node)
      node.addEventListener('animationend', done, { once: true })
      setTimeout(done, LIFE_MS[opts.kind] + 80)
    }
    return n
  }

  const clear = () => {
    for (const node of [...live]) release(node)
  }

  return { emit, alive: () => live.size, clear }
}

const pools = new WeakMap<HTMLElement, ParticlePool>()

export function layerPool(
  container: HTMLElement,
  svgFor: (shape: ParticleShape) => string,
): ParticlePool {
  let p = pools.get(container)
  if (!p) {
    p = createParticlePool(container, svgFor)
    pools.set(container, p)
  }
  return p
}
