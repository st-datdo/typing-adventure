import { describe, expect, it, vi } from 'vitest'
import { createReducedMotionSource } from '../kr/reduced-motion'

function fakeMatchMedia(initial: boolean) {
  const listeners = new Set<() => void>()
  const mql = {
    matches: initial,
    addEventListener: vi.fn((_: string, cb: () => void) => listeners.add(cb)),
    removeEventListener: vi.fn((_: string, cb: () => void) => listeners.delete(cb)),
  }
  const matchMedia = vi.fn(() => mql)
  return {
    matchMedia,
    mql,
    listeners,
    fire(next: boolean) {
      mql.matches = next
      listeners.forEach((l) => l())
    },
  }
}

describe('reduced-motion source', () => {
  it('KR-14 snapshot reflects prefers-reduced-motion', () => {
    const fm = fakeMatchMedia(true)
    const src = createReducedMotionSource(fm.matchMedia as unknown as typeof window.matchMedia)
    expect(src.getSnapshot()).toBe(true)
    expect(fm.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
  })

  it('KR-14 E4 change event notifies subscribers and updates the snapshot', () => {
    const fm = fakeMatchMedia(false)
    const src = createReducedMotionSource(fm.matchMedia as unknown as typeof window.matchMedia)
    const cb = vi.fn()
    src.subscribe(cb)
    expect(src.getSnapshot()).toBe(false)
    fm.fire(true)
    expect(cb).toHaveBeenCalledTimes(1)
    expect(src.getSnapshot()).toBe(true)
  })

  it('KR-14 unsubscribe removes the listener', () => {
    const fm = fakeMatchMedia(false)
    const src = createReducedMotionSource(fm.matchMedia as unknown as typeof window.matchMedia)
    const cb = vi.fn()
    const off = src.subscribe(cb)
    off()
    expect(fm.listeners.size).toBe(0)
    fm.fire(true)
    expect(cb).not.toHaveBeenCalled()
  })

  it('KR-14 without matchMedia (SSR) reports false', () => {
    const src = createReducedMotionSource(undefined)
    expect(src.getSnapshot()).toBe(false)
    expect(src.getServerSnapshot()).toBe(false)
    const off = src.subscribe(() => {})
    expect(() => off()).not.toThrow()
  })
})
