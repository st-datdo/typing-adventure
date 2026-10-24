'use client'

import { useState } from 'react'
import Link from 'next/link'
import { t, tReplace } from '@typing-adventure/i18n'
import type { TranslationKey } from '@typing-adventure/i18n'
import type { MiniGameId } from '@typing-adventure/game-engine'
import { useSettingsStore } from '@/stores/settings-store'
import { useGamesStore } from '@/stores/games-store'
import { useLittleVoice } from '@/hooks/useLittleVoice'
import { BalloonGame } from './BalloonGame'
import { PictureGame } from './PictureGame'
import { Stars } from './Stars'

const GAMES: { id: MiniGameId; icon: string; name: TranslationKey; desc: TranslationKey }[] = [
  { id: 'balloon', icon: '🎈', name: 'gameBalloon', desc: 'gameBalloonDesc' },
  { id: 'picture', icon: '🖼️', name: 'gamePicture', desc: 'gamePictureDesc' },
]

export function GamesHub() {
  const lang = useSettingsStore(s => s.lang)
  const best = useGamesStore(s => s.best)
  const plays = useGamesStore(s => s.plays)
  const voice = useLittleVoice()
  const [screen, setScreen] = useState<'hub' | MiniGameId>('hub')

  const back = () => {
    voice.stop()
    setScreen('hub')
  }

  return (
    <div className="little-root games-root">
      {screen === 'hub' && (
        <div className="little-screen games-hub">
          <header className="little-top">
            <Link href="/" className="little-chip games-back" aria-label={t(lang, 'gamesBack')}>⌨️</Link>
            <h1 className="little-title">🎮 {t(lang, 'gamesTitle')}</h1>
            <span className="little-top-spacer" />
          </header>
          <div className="games-cards">
            {GAMES.map(g => (
              <button
                key={g.id}
                type="button"
                className={`games-card games-card--${g.id}`}
                onClick={() => {
                  voice.unlockAudio()
                  voice.sound('pop')
                  setScreen(g.id)
                }}
              >
                <span className="games-card-icon" aria-hidden>{g.icon}</span>
                <span className="games-card-name">{t(lang, g.name)}</span>
                <span className="games-card-desc">{t(lang, g.desc)}</span>
                <span className="games-card-best">
                  {(best[g.id] ?? 0) > 0 ? <Stars n={best[g.id] ?? 0} /> : <span className="games-card-new">✨</span>}
                </span>
                {(plays[g.id] ?? 0) > 0 && (
                  <span className="games-card-plays">{tReplace(lang, 'gamePlays', plays[g.id] ?? 0)}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
      {screen === 'balloon' && <BalloonGame voice={voice} onBack={back} />}
      {screen === 'picture' && <PictureGame voice={voice} onBack={back} />}
    </div>
  )
}
