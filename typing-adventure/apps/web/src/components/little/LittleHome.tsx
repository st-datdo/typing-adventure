'use client'

import { useEffect, useRef } from 'react'
import { t } from '@typing-adventure/i18n'
import { useSettingsStore } from '@/stores/settings-store'
import { useLittleStore } from '@/stores/little-store'
import type { LittleVoice } from '@/hooks/useLittleVoice'
import { Mascot } from './Mascot'
import { ParentGate } from './ParentGate'
import { EggPicker, Pet } from './Pet'

interface LittleHomeProps {
  voice: LittleVoice
  canPlay: boolean
  onPlay: () => void
  onAlbum: () => void
  onMap: () => void
  onParent: () => void
}

export function LittleHome({ voice, canPlay, onPlay, onAlbum, onMap, onParent }: LittleHomeProps) {
  const lang = useSettingsStore(s => s.lang)
  const pet = useLittleStore(s => s.pet)
  const pickPet = useLittleStore(s => s.pickPet)
  const greetedRef = useRef(false)
  const hasPet = pet.kind !== null

  useEffect(() => {
    const greet = () => {
      if (greetedRef.current) return
      greetedRef.current = true
      voice.unlockAudio()
      if (!canPlay) voice.sleep()
      else if (!hasPet) voice.lines(['littleHello', 'petChoose'])
      else voice.hello()
    }
    const onKey = (e: KeyboardEvent) => {
      if (canPlay && hasPet && (e.key === 'Enter' || e.key === ' ')) {
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
  }, [voice, canPlay, hasPet, onPlay])

  let bubble = t(lang, 'littleSleep')
  if (canPlay) bubble = hasPet ? t(lang, 'littleHello') : t(lang, 'petChoose')

  return (
    <div className="little-screen little-home">
      <header className="little-top">
        <span className="little-top-spacer" />
        <ParentGate onUnlock={onParent} hint={t(lang, 'littleHold')} className="little-gate--corner">
          🔒 {t(lang, 'littleParent')}
        </ParentGate>
      </header>

      <Mascot mood={canPlay ? 'wave' : 'sleep'}>{bubble}</Mascot>

      {hasPet ? (
        <Pet pet={pet} voice={voice} sleeping={!canPlay} />
      ) : (
        <EggPicker voice={voice} onPick={pickPet} />
      )}

      <div className="little-home-actions">
        {canPlay && hasPet && (
          <button type="button" className="little-play-btn" aria-label={t(lang, 'littlePlay')} onClick={onPlay}>
            ▶
          </button>
        )}
        <button type="button" className="little-btn little-btn--soft" onClick={onMap}>
          🗺️ {t(lang, 'littleMap')}
        </button>
        <button type="button" className="little-btn little-btn--soft" onClick={onAlbum}>
          📒 {t(lang, 'littleAlbum')}
        </button>
      </div>
    </div>
  )
}
