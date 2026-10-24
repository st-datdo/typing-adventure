'use client'

import { useEffect, useRef } from 'react'
import { t } from '@typing-adventure/i18n'
import { useSettingsStore } from '@/stores/settings-store'
import type { LittleVoice } from '@/hooks/useLittleVoice'
import { Mascot } from './Mascot'
import { ParentGate } from './ParentGate'

interface LittleHomeProps {
  voice: LittleVoice
  canPlay: boolean
  onPlay: () => void
  onAlbum: () => void
  onParent: () => void
}

export function LittleHome({ voice, canPlay, onPlay, onAlbum, onParent }: LittleHomeProps) {
  const lang = useSettingsStore(s => s.lang)
  const greetedRef = useRef(false)

  useEffect(() => {
    const greet = () => {
      if (greetedRef.current) return
      greetedRef.current = true
      voice.unlockAudio()
      if (canPlay) voice.hello()
      else voice.sleep()
    }
    const onKey = (e: KeyboardEvent) => {
      if (canPlay && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        onPlay()
        return
      }
      greet()
    }
    window.addEventListener('pointerup', greet)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerup', greet)
      window.removeEventListener('keydown', onKey)
    }
  }, [voice, canPlay, onPlay])

  return (
    <div className="little-screen little-home">
      <header className="little-top">
        <span className="little-top-spacer" />
        <ParentGate onUnlock={onParent} hint={t(lang, 'littleHold')} className="little-gate--corner">
          🔒 {t(lang, 'littleParent')}
        </ParentGate>
      </header>

      <Mascot mood={canPlay ? 'wave' : 'sleep'}>
        {canPlay ? t(lang, 'littleHello') : t(lang, 'littleSleep')}
      </Mascot>

      <div className="little-home-actions">
        {canPlay && (
          <button type="button" className="little-play-btn" aria-label={t(lang, 'littlePlay')} onClick={onPlay}>
            ▶
          </button>
        )}
        <button type="button" className="little-btn little-btn--soft" onClick={onAlbum}>
          📒 {t(lang, 'littleAlbum')}
        </button>
      </div>
    </div>
  )
}
