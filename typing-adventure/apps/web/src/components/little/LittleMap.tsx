'use client'

import { getIslandViews } from '@typing-adventure/game-engine'
import type { IslandId } from '@typing-adventure/game-engine'
import { t } from '@typing-adventure/i18n'
import { useSettingsStore } from '@/stores/settings-store'
import { useLittleStore } from '@/stores/little-store'
import type { LittleVoice } from '@/hooks/useLittleVoice'
import type { VoiceLineKey } from '@/lib/audio/voice-clips'

export const ISLAND_NAME_KEYS: Record<IslandId, VoiceLineKey> = {
  sun: 'islandSun',
  forest: 'islandForest',
  candy: 'islandCandy',
  whale: 'islandWhale',
  star: 'islandStar',
}

interface LittleMapProps {
  voice: LittleVoice
  onHome: () => void
}

export function LittleMap({ voice, onHome }: LittleMapProps) {
  const lang = useSettingsStore(s => s.lang)
  const progress = useLittleStore(s => s.progress)
  const views = getIslandViews(progress)

  return (
    <div className="little-screen little-map">
      <header className="little-top">
        <button type="button" className="little-chip" aria-label={t(lang, 'littleHome')} onClick={onHome}>🏠</button>
        <h1 className="little-title">🗺️ {t(lang, 'mapTitle')}</h1>
        <span className="little-top-spacer" />
      </header>

      <ol className="little-islands">
        {views.map(({ island, mastered, status }, i) => {
          const open = status !== 'locked'
          return (
            <li key={island.id} className={`little-island little-island--${status} ${i % 2 ? 'little-island--right' : ''}`}>
              <button
                type="button"
                className="little-island-land"
                disabled={!open}
                aria-label={t(lang, ISLAND_NAME_KEYS[island.id])}
                onClick={() => {
                  voice.sound('pop')
                  voice.lines([ISLAND_NAME_KEYS[island.id]])
                }}
              >
                <span className="little-island-emoji">{island.emoji}</span>
                {status === 'current' && <span className="little-island-boat" aria-hidden>⛵</span>}
                {status === 'done' && <span className="little-island-flag" aria-hidden>🚩</span>}
                {status === 'locked' && <span className="little-island-cloud" aria-hidden>☁️</span>}
              </button>
              <div className="little-island-info">
                <div className="little-island-name">{open ? t(lang, ISLAND_NAME_KEYS[island.id]) : '? ? ?'}</div>
                {open && (
                  <div className="little-island-letters">
                    {island.letters.map(l => (
                      <button
                        key={l}
                        type="button"
                        className={`little-island-letter ${mastered.includes(l) ? 'little-island-letter--on' : ''}`}
                        onClick={() => {
                          voice.note(l)
                          voice.letter(l)
                        }}
                      >
                        {l.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
