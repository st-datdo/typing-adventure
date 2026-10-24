'use client'

import { useState } from 'react'
import { PET_EMOJI, PET_KINDS, getPetStage } from '@typing-adventure/game-engine'
import type { PetKind, PetState } from '@typing-adventure/game-engine'
import { t } from '@typing-adventure/i18n'
import { useSettingsStore } from '@/stores/settings-store'
import type { LittleVoice } from '@/hooks/useLittleVoice'
import type { VoiceLineKey } from '@/lib/audio/voice-clips'

export const PET_NAME_KEYS: Record<PetKind, VoiceLineKey> = {
  kitty: 'petKitty',
  puppy: 'petPuppy',
  dino: 'petDino',
}

interface PetProps {
  pet: PetState
  voice: LittleVoice
  sleeping?: boolean
  celebrate?: boolean
}

export function Pet({ pet, voice, sleeping, celebrate }: PetProps) {
  const lang = useSettingsStore(s => s.lang)
  const [bounce, setBounce] = useState(0)
  if (pet.kind === null) return null
  const stage = getPetStage(pet.days)
  const emoji = stage.hatched ? PET_EMOJI[pet.kind] : '🥚'

  return (
    <button
      type="button"
      className={`little-pet little-pet--${pet.kind} ${sleeping ? 'little-pet--sleep' : ''} ${celebrate ? 'little-pet--celebrate' : ''}`}
      aria-label={t(lang, PET_NAME_KEYS[pet.kind])}
      onClick={() => {
        voice.unlockAudio()
        voice.sound('pop')
        voice.lines(stage.hatched ? ['petHappy'] : ['petEggPicked'])
        setBounce(b => b + 1)
      }}
    >
      <span
        key={bounce}
        className={`little-pet-body ${stage.hatched ? '' : 'little-pet-egg'} ${bounce > 0 ? 'little-pet-body--bounce' : ''}`}
        style={{ ['--pet-scale' as string]: String(stage.scale) }}
      >
        {stage.accessory && <span className="little-pet-acc" aria-hidden>{stage.accessory}</span>}
        {emoji}
      </span>
      {sleeping && <span className="little-zzz" aria-hidden>💤</span>}
      {!sleeping && stage.hatched && <span className="little-pet-heart" aria-hidden>💛</span>}
    </button>
  )
}

interface EggPickerProps {
  voice: LittleVoice
  onPick: (kind: PetKind) => void
}

export function EggPicker({ voice, onPick }: EggPickerProps) {
  const lang = useSettingsStore(s => s.lang)
  return (
    <div className="little-eggs" role="group" aria-label={t(lang, 'petChoose')}>
      {PET_KINDS.map(kind => (
        <button
          key={kind}
          type="button"
          className={`little-egg little-egg--${kind}`}
          aria-label={t(lang, PET_NAME_KEYS[kind])}
          onClick={() => {
            voice.unlockAudio()
            voice.sound('sparkle')
            onPick(kind)
            voice.lines(['petEggPicked'])
          }}
        >
          <span className="little-egg-shell">🥚</span>
          <span className="little-egg-peek" aria-hidden>{PET_EMOJI[kind]}</span>
        </button>
      ))}
    </div>
  )
}
