'use client'

import { memo, useLayoutEffect, useState, type CSSProperties, type RefObject } from 'react'
import { useFxStore } from '@/stores/fx-store'
import { layerPool } from '@/lib/fx/dom-particles'
import { mulberry32 } from '@/lib/fx/rng'
import type { WordFxKind } from '@/lib/fx/pools'
import { CheckStamp, ParticleSprite, particleSvg } from './sprites'

interface Rect {
  left: number
  top: number
  width: number
  height: number
}

interface WordCompleteFxViewProps {
  kind: WordFxKind
  rect: Rect
  tilt: number
  fly: { dx: number; dy: number }
}

export function WordCompleteFxView({ kind, rect, tilt, fly }: WordCompleteFxViewProps) {
  const style = {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    '--fx-tilt': `${tilt}deg`,
    '--fx-fly-x': `${fly.dx}px`,
    '--fx-fly-y': `${fly.dy}px`,
  } as CSSProperties
  return (
    <div className={`fx-word fx-word--${kind}`} data-kind={kind} aria-hidden="true" style={style}>
      {kind === 'star-fly' && (
        <span className="fx-word-star">
          <ParticleSprite shape="star" size={20} />
        </span>
      )}
      {kind === 'stamp' && (
        <span className="fx-word-stamp">
          <CheckStamp />
        </span>
      )}
      {kind === 'bubble-up' &&
        [0, 1, 2].map((i) => (
          <span key={i} className="fx-word-bubble">
            <ParticleSprite shape="bubble" size={14 + i * 3} />
          </span>
        ))}
    </div>
  )
}

interface WordCompleteFxProps {
  layerRef: RefObject<HTMLDivElement | null>
  suppressed: boolean
}

interface Placed {
  id: number
  kind: WordFxKind
  rect: Rect
  tilt: number
  fly: { dx: number; dy: number }
}

export const WordCompleteFx = memo(function WordCompleteFx({
  layerRef,
  suppressed,
}: WordCompleteFxProps) {
  const word = useFxStore((s) => s.word)
  const [placed, setPlaced] = useState<Placed | null>(null)

  useLayoutEffect(() => {
    const layer = layerRef.current
    if (!word || !layer || suppressed) {
      setPlaced(null)
      return
    }
    const section = layer.parentElement
    const first = section?.querySelector<HTMLElement>(`.char[data-i="${word.range[0]}"]`)
    const last = section?.querySelector<HTMLElement>(`.char[data-i="${word.range[1] - 1}"]`)
    if (!first || !last) return
    const l = layer.getBoundingClientRect()
    const a = first.getBoundingClientRect()
    const b = last.getBoundingClientRect()
    const rect = {
      left: a.left - l.left,
      top: Math.min(a.top, b.top) - l.top,
      width: Math.max(8, b.right - a.left),
      height: Math.max(a.height, b.height),
    }
    const meter = document.querySelector('.combo-meter')?.getBoundingClientRect()
    const fly = meter
      ? {
          dx: Math.round(meter.left + meter.width / 2 - (a.left + rect.width / 2)),
          dy: Math.round(meter.top + meter.height / 2 - a.top),
        }
      : { dx: 0, dy: -80 }
    setPlaced({ id: word.id, kind: word.kind, rect, tilt: word.tilt, fly })
    if (word.kind === 'confetti-pop') {
      const rng = mulberry32(word.id * 7919)
      layerPool(layer, particleSvg).emit(
        { x: rect.left + rect.width / 2, y: rect.top },
        {
          kind: 'confetti',
          shapes: ['dot'],
          count: 10 + Math.floor(rng() * 5),
          rng,
          spreadX: rect.width,
        },
      )
    }
  }, [word, suppressed, layerRef])

  if (!placed || suppressed || !word || placed.id !== word.id) return null
  return (
    <WordCompleteFxView
      key={placed.id}
      kind={placed.kind}
      rect={placed.rect}
      tilt={placed.tilt}
      fly={placed.fly}
    />
  )
})
