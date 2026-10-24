'use client'

import { useEffect } from 'react'
import { t, tReplace } from '@typing-adventure/i18n'
import { getCurrentIsland } from '@typing-adventure/game-engine'
import type { Island, LetterProgress, Sticker } from '@typing-adventure/game-engine'
import { useSettingsStore } from '@/stores/settings-store'
import { useLittleStore } from '@/stores/little-store'
import type { VoiceLineKey } from '@/lib/audio/voice-clips'
import type { LittleVoice } from '@/hooks/useLittleVoice'
import { Mascot } from './Mascot'
import { ParentGate } from './ParentGate'
import { Burst } from './Burst'
import { Pet } from './Pet'
import { ISLAND_NAME_KEYS } from './LittleMap'
import type { PetEvent } from './LittleMode'

const ALBUM_PREVIEW = 6

interface LittleEndProps {
  voice: LittleVoice
  sticker: Sticker
  found: number
  island: Island | null
  petEvent: PetEvent
  collected: string[]
  canPlayMore: boolean
  onPlayMore: () => void
  onBonusPlay: () => void
  onAlbum: () => void
  onHome: () => void
}

export function LittleEnd({ voice, sticker, found, island, petEvent, collected, canPlayMore, onPlayMore, onBonusPlay, onAlbum, onHome }: LittleEndProps) {
  const lang = useSettingsStore(s => s.lang)
  const pet = useLittleStore(s => s.pet)
  const progress = useLittleStore(s => s.progress)
  const islandLines = islandAnnouncement(island, progress)
  const petLine = petAnnouncement(petEvent)

  useEffect(() => {
    voice.sound('sticker')
    voice.done(found)
    const petKey = petAnnouncement(petEvent)
    if (petKey) voice.lines([petKey], false)
    const lines = islandAnnouncement(island, useLittleStore.getState().progress)
    if (lines.length > 0) voice.lines(lines, false)
    if (!canPlayMore) voice.sleep(false)
  }, [voice, found, canPlayMore, petEvent, island])

  const preview = collected.slice(-ALBUM_PREVIEW)

  return (
    <div className="little-screen little-end">
      <Mascot mood={canPlayMore ? 'happy' : 'sleep'}>
        {tReplace(lang, 'littleDone', found)}
        {!canPlayMore && <><br />{t(lang, 'littleSleep')}</>}
      </Mascot>

      {(petLine || islandLines.length > 0) && (
        <div className="little-end-news">
          {pet.kind !== null && <Pet pet={pet} voice={voice} celebrate={petLine !== null} />}
          <div className="little-end-news-text">
            {petLine && <div>{t(lang, petLine)}</div>}
            {island && <div>{island.emoji} {islandLines.map(k => t(lang, k)).join(' ')}</div>}
          </div>
        </div>
      )}

      <div className="little-sticker-reveal">
        <div className="little-sticker-new" aria-label={sticker.name}>{sticker.emoji}</div>
        <Burst id={1} emoji={sticker.emoji} big />
        <div className="little-sticker-caption">{t(lang, 'littleNewSticker')}</div>
      </div>

      <div className="little-album-strip">
        {preview.map((emoji, i) => (
          <span key={`${emoji}-${i}`} className={`little-slot ${i === preview.length - 1 ? 'little-slot--new' : ''}`}>{emoji}</span>
        ))}
      </div>

      <div className="little-home-actions">
        {canPlayMore && (
          <button type="button" className="little-btn little-btn--go" onClick={onPlayMore}>
            ▶ {t(lang, 'littlePlayMore')}
          </button>
        )}
        <button type="button" className="little-btn little-btn--soft" onClick={onAlbum}>
          📒 {t(lang, 'littleAlbum')}
        </button>
        <button type="button" className="little-btn little-btn--soft" onClick={onHome}>
          🏠 {t(lang, 'littleHome')}
        </button>
      </div>

      {!canPlayMore && (
        <ParentGate onUnlock={onBonusPlay} hint={t(lang, 'littleHold')} className="little-gate--inline">
          🔒 {t(lang, 'littleMore')}
        </ParentGate>
      )}
    </div>
  )
}

function petAnnouncement(petEvent: PetEvent): VoiceLineKey | null {
  if (petEvent === 'hatched') return 'petHatched'
  if (petEvent === 'grew') return 'petGrew'
  return null
}

function islandAnnouncement(island: Island | null, progress: LetterProgress): VoiceLineKey[] {
  if (!island) return []
  if (getCurrentIsland(progress) === null) return ['islandAllDone']
  return ['islandNew', ISLAND_NAME_KEYS[island.id]]
}
