'use client'

import { memo, useEffect, useRef } from 'react'
import { fxCanvas, type CanvasSlot } from '@/lib/fx/confetti'
import { useFxStore } from '@/stores/fx-store'

const COLOR_TOKENS = ['--kr-play', '--kr-fun', '--kr-primary', '--kr-success']

export function themeColors(el: Element): string[] {
  const cs = getComputedStyle(el)
  return COLOR_TOKENS.map((t) => cs.getPropertyValue(t).trim()).filter(Boolean)
}

export function prefetchCanvas() {
  return fxCanvas().prefetch()
}

export function useCanvasSlot(slot: CanvasSlot) {
  const ref = useRef<HTMLCanvasElement>(null)
  const level = useFxStore((s) => s.level)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctl = fxCanvas()
    ctl.prefetch()
    return ctl.attach(slot, c)
  }, [slot])
  useEffect(() => {
    fxCanvas().setLevel(level)
  }, [level])
  return ref
}

export const TierConfetti = memo(function TierConfetti({ suppressed }: { suppressed: boolean }) {
  const ref = useCanvasSlot('confetti')
  const confetti = useFxStore((s) => s.confetti)
  const lastId = useRef<number | null>(null)

  useEffect(() => {
    if (!confetti || confetti.id === lastId.current) return
    lastId.current = confetti.id
    const c = ref.current
    if (!c || suppressed) return
    const ch = document.querySelector(`.word-display .char[data-i="${confetti.index}"]`)
    let origin = { x: 0.5, y: 0.5 }
    if (ch) {
      const r = ch.getBoundingClientRect()
      origin = {
        x: (r.left + r.width / 2) / window.innerWidth,
        y: (r.top + r.height / 2) / window.innerHeight,
      }
    }
    const ctl = fxCanvas()
    ctl.setColors(themeColors(c))
    ctl.fire('confetti', confetti, origin)
  }, [confetti, suppressed, ref])

  useEffect(() => {
    if (suppressed) fxCanvas().reset()
  }, [suppressed])

  return (
    <canvas ref={ref} className="fx-canvas fx-canvas--top" aria-hidden="true" data-active="false" />
  )
})
