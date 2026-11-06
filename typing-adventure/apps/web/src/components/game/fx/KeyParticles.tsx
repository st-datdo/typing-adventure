'use client'

import { memo, useEffect, type RefObject } from 'react'
import { useFxStore } from '@/stores/fx-store'
import { layerPool } from '@/lib/fx/dom-particles'
import { mulberry32 } from '@/lib/fx/rng'
import { particleSvg } from './sprites'

interface KeyParticlesProps {
  layerRef: RefObject<HTMLDivElement | null>
  suppressed: boolean
}

export const KeyParticles = memo(function KeyParticles({
  layerRef,
  suppressed,
}: KeyParticlesProps) {
  const sparks = useFxStore((s) => s.sparks)

  useEffect(() => {
    const layer = layerRef.current
    if (!layer || !suppressed) return
    layerPool(layer, particleSvg).clear()
  }, [suppressed, layerRef])

  useEffect(() => {
    const layer = layerRef.current
    if (!sparks || !layer || suppressed || document.visibilityState === 'hidden') return
    const section = layer.parentElement
    const char = section?.querySelector<HTMLElement>(`.char[data-i="${sparks.index}"]`)
    if (!char) return
    const l = layer.getBoundingClientRect()
    const r = char.getBoundingClientRect()
    layerPool(layer, particleSvg).emit(
      { x: r.left - l.left + r.width / 2, y: r.top - l.top + r.height / 2 },
      { kind: 'spark', shapes: sparks.shapes, count: sparks.count, rng: mulberry32(sparks.seed) },
    )
  }, [sparks, suppressed, layerRef])

  return null
})
