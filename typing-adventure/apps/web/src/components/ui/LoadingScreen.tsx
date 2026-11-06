import type { ReactNode } from 'react'
import { t } from '@typing-adventure/i18n'
import type { Lang } from '@typing-adventure/game-engine'
import { OwlMascot } from '../mascot/OwlMascot'

interface LoadingScreenProps {
  icon?: ReactNode
  label?: string
  inline?: boolean
  lang?: Lang
}

export function LoadingScreen({ icon, label, inline = false, lang = 'vi' }: LoadingScreenProps) {
  return (
    <div
      className={inline ? 'ui-loading ui-loading--inline' : 'ui-loading'}
      role="status"
      aria-live="polite"
    >
      <span className="ui-loading-icon" aria-hidden>
        {icon ?? <OwlMascot mood="thinking" size={inline ? 'sm' : 'md'} />}
      </span>
      {label ? <span>{label}</span> : <span className="sr-only">{t(lang, 'loadingText')}</span>}
    </div>
  )
}
