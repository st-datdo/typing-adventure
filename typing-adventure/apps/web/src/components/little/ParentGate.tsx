'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

const HOLD_MS = 3000

interface ParentGateProps {
  onUnlock: () => void
  children: ReactNode
  hint: string
  className?: string
}

export function ParentGate({ onUnlock, children, hint, className = '' }: ParentGateProps) {
  const [progress, setProgress] = useState(0)
  const startRef = useRef<number | null>(null)
  const frameRef = useRef<number | null>(null)

  const stop = () => {
    startRef.current = null
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
    setProgress(0)
  }

  const tick = () => {
    if (startRef.current === null) return
    const p = Math.min(1, (performance.now() - startRef.current) / HOLD_MS)
    setProgress(p)
    if (p >= 1) {
      stop()
      onUnlock()
      return
    }
    frameRef.current = requestAnimationFrame(tick)
  }

  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
  }, [])

  return (
    <button
      type="button"
      className={`little-gate ${className}`}
      style={{ ['--gate' as string]: `${progress * 360}deg` }}
      title={hint}
      onPointerDown={(e) => {
        e.preventDefault()
        startRef.current = performance.now()
        frameRef.current = requestAnimationFrame(tick)
      }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span className="little-gate-ring" aria-hidden />
      <span className="little-gate-label">{children}</span>
      <small className="little-gate-hint">{hint}</small>
    </button>
  )
}
