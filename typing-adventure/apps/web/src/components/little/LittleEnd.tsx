'use client'

import { useEffect } from 'react'
import { t, tReplace } from '@typing-adventure/i18n'
import type { Sticker } from '@typing-adventure/game-engine'
import { useSettingsStore } from '@/stores/settings-store'
import type { LittleVoice } from '@/hooks/useLittleVoice'
import { Mascot } from './Mascot'
import { ParentGate } from './ParentGate'
import { Burst } from './Burst'

const ALBUM_PREVIEW = 6

interface LittleEndProps {
  voice: LittleVoice
  sticker: Sticker
  found: number
  collected: string[]
  canPlayMore: boolean
  onPlayMore: () => void
  onBonusPlay: () => void
  onAlbum: () => void
  onHome: () => void
}

export function LittleEnd({ voice, sticker, found, collected, canPlayMore, onPlayMore, onBonusPlay, onAlbum, onHome }: LittleEndProps) {
  const lang = useSettingsStore(s => s.lang)

  useEffect(() => {
    voice.sound('sticker')
    voice.done(found)
    if (!canPlayMore) voice.sleep(false)
  }, [voice, found, canPlayMore])

  const preview = collected.slice(-ALBUM_PREVIEW)

  return (
    <div className="little-screen little-end">
      <Mascot mood={canPlayMore ? 'happy' : 'sleep'}>
        {tReplace(lang, 'littleDone', found)}
        {!canPlayMore && <><br />{t(lang, 'littleSleep')}</>}
      </Mascot>

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
