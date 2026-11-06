'use client'

import { memo, useEffect, useState, type CSSProperties } from 'react'
import { Icon } from '@/components/ui/icons/Icon'
import { meterLevel, nextTierInfo } from '@/lib/fx/tiers'
import { useFxStore } from '@/stores/fx-store'

const SMOKE_MS = 500

export function ComboMeterView({ combo, smoke }: { combo: number; smoke: boolean }) {
  const level = meterLevel(combo)
  const { progress } = nextTierInfo(combo)
  return (
    <span
      className="combo-meter"
      data-level={level}
      data-smoke={smoke ? 'true' : 'false'}
      aria-hidden="true"
      style={{ '--fx-progress': progress } as CSSProperties}
    >
      <span className="combo-meter-flame">
        <Icon name="flame" size={22} />
      </span>
      <span className="combo-meter-num" key={combo}>
        {combo}
      </span>
      <span className="combo-meter-bar">
        <span className="combo-meter-fill" />
      </span>
      {smoke && (
        <span className="combo-meter-puffs">
          {[0, 1, 2].map((i) => (
            <span key={i} className="combo-meter-smoke" />
          ))}
        </span>
      )}
    </span>
  )
}

export const ComboMeter = memo(function ComboMeter({ combo }: { combo: number }) {
  const smokeId = useFxStore((s) => s.meter.smokeId)
  const [smoking, setSmoking] = useState(false)
  useEffect(() => {
    if (smokeId === 0) {
      setSmoking(false)
      return
    }
    setSmoking(true)
    const t = setTimeout(() => setSmoking(false), SMOKE_MS)
    return () => clearTimeout(t)
  }, [smokeId])
  return <ComboMeterView combo={combo} smoke={smoking} />
})
