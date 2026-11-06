'use client'

import { useRef, type KeyboardEvent } from 'react'
import { nextIndex } from '@/lib/kr/choice-nav'
import { Icon } from './icons/Icon'
import type { IconName } from './icons/icons'

export interface ChoiceOption<T extends string | number> {
  value: T
  label: string
  icon: IconName
}

interface ChoiceCardsProps<T extends string | number> {
  labelId: string
  options: ChoiceOption<T>[]
  value: T
  onChange: (value: T) => void
  columns?: 1 | 2
}

export function ChoiceCards<T extends string | number>({
  labelId,
  options,
  value,
  onChange,
  columns = 2,
}: ChoiceCardsProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const selected = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  )

  const handleKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const next = nextIndex(e.key, i, options.length)
    if (next === null) return
    e.preventDefault()
    e.stopPropagation()
    refs.current[next]?.focus()
    onChange(options[next].value)
  }

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelId}
      className={`choice-cards choice-cards--${columns}`}
    >
      {options.map((o, i) => {
        const checked = i === selected
        return (
          <button
            key={String(o.value)}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            className={checked ? 'choice-card choice-card--on' : 'choice-card'}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => handleKey(e, i)}
          >
            <span className="choice-icon">
              <Icon name={o.icon} size={26} />
            </span>
            <span className="choice-label">{o.label}</span>
            {checked && (
              <span className="choice-check">
                <Icon name="check" size={16} />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
