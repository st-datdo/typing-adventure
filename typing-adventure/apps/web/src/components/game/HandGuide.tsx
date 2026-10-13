'use client'

import { getFingerForKey } from '@typing-adventure/game-engine'
import type { GameState, Finger } from '@typing-adventure/game-engine'
import { useSettingsStore } from '@/stores/settings-store'
import { t } from '@typing-adventure/i18n'
import type { TranslationKey } from '@typing-adventure/i18n'

const FINGER_LABEL_KEYS: Record<Finger, TranslationKey> = {
  'left-pinky': 'fingerLeftPinky',
  'left-ring': 'fingerLeftRing',
  'left-middle': 'fingerLeftMiddle',
  'left-index': 'fingerLeftIndex',
  'right-index': 'fingerRightIndex',
  'right-middle': 'fingerRightMiddle',
  'right-ring': 'fingerRightRing',
  'right-pinky': 'fingerRightPinky',
  'thumb': 'fingerThumb',
}

interface HandGuideProps {
  gameState: GameState
}

export function HandGuide({ gameState }: HandGuideProps) {
  const fingerGuide = useSettingsStore(s => s.fingerGuide)
  const lang = useSettingsStore(s => s.lang)

  if (!fingerGuide) return null

  const expected = gameState.currentIndex < gameState.text.length
    ? gameState.text[gameState.currentIndex]
    : null
  const finger = expected !== null ? getFingerForKey(expected) : null
  const labelKey = finger ? FINGER_LABEL_KEYS[finger] : null
  const label = labelKey ? t(lang, labelKey) : ''

  const isActive = (id: string) => {
    if (!finger) return false
    if (finger === 'thumb') return id.includes('thumb')
    return id === `finger-${finger}`
  }

  return (
    <section className="hands-guide">
      <svg className="hand-svg hand-left" viewBox="0 0 260 300" xmlns="http://www.w3.org/2000/svg">
        <ellipse className="palm-path" cx="120" cy="220" rx="75" ry="65" />
        <rect id="finger-left-pinky" className={`finger-path ${isActive('finger-left-pinky') ? 'finger--active' : ''}`} x="28" y="95" width="28" height="90" rx="14" />
        <circle className="fingertip" cx="42" cy="95" r="14" />
        <rect id="finger-left-ring" className={`finger-path ${isActive('finger-left-ring') ? 'finger--active' : ''}`} x="62" y="60" width="30" height="110" rx="15" />
        <circle className="fingertip" cx="77" cy="60" r="15" />
        <rect id="finger-left-middle" className={`finger-path ${isActive('finger-left-middle') ? 'finger--active' : ''}`} x="100" y="35" width="32" height="120" rx="16" />
        <circle className="fingertip" cx="116" cy="35" r="16" />
        <rect id="finger-left-index" className={`finger-path ${isActive('finger-left-index') ? 'finger--active' : ''}`} x="140" y="55" width="30" height="110" rx="15" />
        <circle className="fingertip" cx="155" cy="55" r="15" />
        <ellipse id="finger-thumb-left" className={`finger-path ${isActive('finger-thumb-left') ? 'finger--active' : ''}`} cx="200" cy="205" rx="22" ry="48" transform="rotate(25,200,205)" />
      </svg>

      {label && (
        <div className="finger-label label--visible">{label}</div>
      )}

      <svg className="hand-svg hand-right" viewBox="0 0 260 300" xmlns="http://www.w3.org/2000/svg">
        <ellipse className="palm-path" cx="140" cy="220" rx="75" ry="65" />
        <rect id="finger-right-index" className={`finger-path ${isActive('finger-right-index') ? 'finger--active' : ''}`} x="90" y="55" width="30" height="110" rx="15" />
        <circle className="fingertip" cx="105" cy="55" r="15" />
        <rect id="finger-right-middle" className={`finger-path ${isActive('finger-right-middle') ? 'finger--active' : ''}`} x="128" y="35" width="32" height="120" rx="16" />
        <circle className="fingertip" cx="144" cy="35" r="16" />
        <rect id="finger-right-ring" className={`finger-path ${isActive('finger-right-ring') ? 'finger--active' : ''}`} x="168" y="60" width="30" height="110" rx="15" />
        <circle className="fingertip" cx="183" cy="60" r="15" />
        <rect id="finger-right-pinky" className={`finger-path ${isActive('finger-right-pinky') ? 'finger--active' : ''}`} x="204" y="95" width="28" height="90" rx="14" />
        <circle className="fingertip" cx="218" cy="95" r="14" />
        <ellipse id="finger-thumb-right" className={`finger-path ${isActive('finger-thumb-right') ? 'finger--active' : ''}`} cx="60" cy="205" rx="22" ry="48" transform="rotate(-25,60,205)" />
      </svg>
    </section>
  )
}
