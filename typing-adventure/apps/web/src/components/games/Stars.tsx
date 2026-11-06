'use client'

import { tReplace } from '@typing-adventure/i18n'
import { useSettingsStore } from '@/stores/settings-store'
import { starDelays } from '@/lib/kr/result-celebration'
import { Icon } from '@/components/ui/icons/Icon'

const MAX_STARS = 3
const SIZES = { sm: 22, md: 32, lg: 52 }

interface StarsProps {
  n: number
  size?: keyof typeof SIZES
  animate?: boolean
}

export function Stars({ n, size = 'md', animate = false }: StarsProps) {
  const lang = useSettingsStore((s) => s.lang)
  const delays = starDelays(MAX_STARS)
  return (
    <span
      className={`games-stars games-stars--${size}`}
      role="img"
      aria-label={tReplace(lang, 'starsLabel', n)}
    >
      {Array.from({ length: MAX_STARS }, (_, i) => {
        const on = i < n
        return (
          <span
            key={i}
            className={`games-star ${on ? 'star--on' : 'star--off'}${on && animate ? ' star--pop' : ''}`}
            style={on && animate ? { animationDelay: `${delays[i]}ms` } : undefined}
          >
            <Icon name="star" size={SIZES[size]} />
          </span>
        )
      })}
    </span>
  )
}
