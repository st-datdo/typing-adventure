'use client'

import { useSyncExternalStore } from 'react'
import { createReducedMotionSource, type ReducedMotionSource } from '@/lib/kr/reduced-motion'

let source: ReducedMotionSource | null = null

function getSource(): ReducedMotionSource {
  if (!source) {
    source = createReducedMotionSource(
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia.bind(window)
        : undefined,
    )
  }
  return source
}

export function usePrefersReducedMotion(): boolean {
  const s = getSource()
  return useSyncExternalStore(s.subscribe, s.getSnapshot, s.getServerSnapshot)
}
