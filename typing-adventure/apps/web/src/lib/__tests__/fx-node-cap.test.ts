import { describe, expect, it } from 'vitest'
import { createParticlePool, liveParticleCount, reserveParticles } from '@/lib/fx/dom-particles'
import { DOM_NODE_CAP } from '@/lib/fx/budget'
import { mulberry32 } from '@/lib/fx/rng'

function fakeContainer() {
  const children = new Set<unknown>()
  const doc = {
    createElement: () => {
      const node = {
        className: '',
        innerHTML: '',
        style: { setProperty: () => {} } as Record<string, unknown>,
        setAttribute: () => {},
        addEventListener: () => {},
        remove: () => children.delete(node),
      }
      return node
    },
  }
  return {
    ownerDocument: doc,
    appendChild: (n: unknown) => children.add(n),
    children,
  } as unknown as HTMLElement & { children: Set<unknown> }
}

describe('FX shared DOM node cap', () => {
  it('FX-17 sticker rain reservations count toward the 60 node cap for sparks', () => {
    const base = liveParticleCount()
    const release = reserveParticles(18)
    expect(liveParticleCount()).toBe(base + 18)
    const pool = createParticlePool(fakeContainer(), () => '')
    const n = pool.emit(
      { x: 0, y: 0 },
      { kind: 'spark', shapes: ['star'], count: 60, rng: mulberry32(1) },
    )
    expect(base + 18 + n).toBeLessThanOrEqual(DOM_NODE_CAP)
    expect(liveParticleCount()).toBeLessThanOrEqual(DOM_NODE_CAP)
    pool.clear()
    release()
    release()
    expect(liveParticleCount()).toBe(base)
  })
})
