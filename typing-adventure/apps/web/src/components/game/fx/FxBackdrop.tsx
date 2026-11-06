'use client'

import { memo, useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { fxCanvas } from '@/lib/fx/confetti'
import type { FxState } from '@/lib/fx/director'
import { allocateNodes } from '@/lib/fx/budget'
import { liveParticleCount } from '@/lib/fx/dom-particles'
import { mulberry32 } from '@/lib/fx/rng'
import { useFxStore } from '@/stores/fx-store'
import { ParticleSprite, StickerSprite } from './sprites'
import { themeColors, useCanvasSlot } from './TierConfetti'

interface FxBackdropViewProps {
  sky: FxState['sky']
  rain: FxState['rain']
  alive: number
  suppressed: boolean
  children?: ReactNode
}

const RAINBOW = ['--kr-fun', '--kr-play', '--kr-success', '--kr-primary', '--kr-fun-deep']

function Sky({ sky }: { sky: NonNullable<FxState['sky']> }) {
  return (
    <div className={`fx-sky fx-sky--${sky}`}>
      {sky === 'rainbow' && (
        <svg className="fx-sky-art" viewBox="0 0 400 200" preserveAspectRatio="xMidYMax meet">
          {RAINBOW.map((c, i) => (
            <path
              key={c}
              d={`M${20 + i * 14} 200a${180 - i * 14} ${180 - i * 14} 0 0 1 ${360 - i * 28} 0`}
              fill="none"
              stroke={`var(${c})`}
              strokeWidth={14}
            />
          ))}
        </svg>
      )}
      {sky === 'shooting-stars' && (
        <div className="fx-sky-art">
          {[12, 26, 44, 60, 78, 90].map((x, i) => (
            <span
              key={x}
              className="fx-sky-star"
              style={{ left: `${x}%`, top: `${20 + ((i * 37) % 60)}%` } as CSSProperties}
            >
              <ParticleSprite shape="sparkle" size={14} />
            </span>
          ))}
          <span className="fx-sky-streak" style={{ left: '20%', top: '18%' }} />
          <span className="fx-sky-streak" style={{ left: '62%', top: '30%' }} />
        </div>
      )}
      {sky === 'balloons' && (
        <div className="fx-sky-art">
          {[8, 30, 70, 90].map((x, i) => (
            <span
              key={x}
              className="fx-sky-balloon"
              style={{ left: `${x}%`, top: `${18 + (i % 2) * 24}%` } as CSSProperties}
            >
              <StickerSprite kind="balloon" />
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export function FxBackdropView({ sky, rain, alive, suppressed, children }: FxBackdropViewProps) {
  let stickers: {
    left: number
    size: number
    delay: number
    dur: number
    rot: number
    kind: string
  }[] = []
  if (rain && !suppressed) {
    const n = allocateNodes(alive, rain.count)
    const rng = mulberry32(rain.seed)
    stickers = Array.from({ length: n }, (_, i) => ({
      left: Math.round(rng() * 96 * 10) / 10,
      size: Math.round(28 + rng() * 16),
      delay: Math.round(rng() * 300),
      dur: Math.round(1500 + rng() * 400),
      rot: Math.round(rng() * 180 - 90),
      kind: rain.stickers[i % rain.stickers.length],
    }))
  }
  return (
    <div className="fx-backdrop" aria-hidden="true">
      {children}
      {sky && <Sky sky={sky} />}
      {rain &&
        stickers.map((s, i) => (
          <span
            key={`${rain.id}-${i}`}
            className="fx-p fx-sticker"
            style={
              {
                left: `${s.left}%`,
                width: s.size,
                height: s.size,
                animationDelay: `${s.delay}ms`,
                animationDuration: `${s.dur}ms`,
                '--fx-rot': `${s.rot}deg`,
              } as CSSProperties
            }
          >
            <StickerSprite kind={s.kind as Parameters<typeof StickerSprite>[0]['kind']} />
          </span>
        ))}
    </div>
  )
}

export const FxBackdrop = memo(function FxBackdrop({ suppressed }: { suppressed: boolean }) {
  const sky = useFxStore((s) => s.sky)
  const rain = useFxStore((s) => s.rain)
  return (
    <FxBackdropView sky={sky} rain={rain} alive={liveParticleCount()} suppressed={suppressed}>
      <FireworksCanvas suppressed={suppressed} />
    </FxBackdropView>
  )
})

function FireworksCanvas({ suppressed }: { suppressed: boolean }) {
  const ref = useCanvasSlot('fireworks')
  const fireworks = useFxStore((s) => s.fireworks)
  const lastId = useRef<number | null>(null)
  useEffect(() => {
    if (!fireworks || fireworks.id === lastId.current) return
    lastId.current = fireworks.id
    const c = ref.current
    if (!c || suppressed) return
    const ctl = fxCanvas()
    ctl.setColors(themeColors(c))
    ctl.fire('fireworks', fireworks)
  }, [fireworks, suppressed, ref])
  return (
    <canvas ref={ref} className="fx-canvas fx-canvas--bg" aria-hidden="true" data-active="false" />
  )
}
