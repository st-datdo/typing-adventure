'use client'

import { STICKERS } from '@typing-adventure/game-engine'
import { t } from '@typing-adventure/i18n'
import { useSettingsStore } from '@/stores/settings-store'
import type { LittleVoice } from '@/hooks/useLittleVoice'

interface LittleAlbumProps {
  voice: LittleVoice
  collected: string[]
  onHome: () => void
}

export function LittleAlbum({ voice, collected, onHome }: LittleAlbumProps) {
  const lang = useSettingsStore(s => s.lang)
  const owned = new Set(collected)

  return (
    <div className="little-screen little-album">
      <header className="little-top">
        <button type="button" className="little-chip" aria-label={t(lang, 'littleHome')} onClick={onHome}>🏠</button>
        <h1 className="little-title">📒 {t(lang, 'littleAlbumTitle')}</h1>
        <span className="little-top-spacer" />
      </header>

      <div className="little-album-grid">
        {STICKERS.map(s => owned.has(s.emoji) ? (
          <button
            key={s.emoji}
            type="button"
            className="little-slot little-slot--owned"
            aria-label={s.name}
            onClick={() => {
              voice.sound('pop')
              voice.stickerName(s.name)
            }}
          >
            {s.emoji}
          </button>
        ) : (
          <span key={s.emoji} className="little-slot little-slot--empty" aria-hidden>?</span>
        ))}
      </div>
    </div>
  )
}
