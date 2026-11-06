'use client'

import { useState, type CSSProperties } from 'react'
import { TopBar } from '@/components/ui/TopBar'
import { t, tReplace } from '@typing-adventure/i18n'
import type { TranslationKey } from '@typing-adventure/i18n'
import type { MiniGameId } from '@typing-adventure/game-engine'
import { useSettingsStore } from '@/stores/settings-store'
import { useGamesStore } from '@/stores/games-store'
import { useLittleVoice } from '@/hooks/useLittleVoice'
import { BalloonGame } from './BalloonGame'
import { PictureGame } from './PictureGame'
import { Stars } from './Stars'
import { Icon } from '@/components/ui/icons/Icon'
import { SceneBackdrop } from '@/components/decor/SceneBackdrop'

const GAMES: { id: MiniGameId; name: TranslationKey; desc: TranslationKey }[] = [
  { id: 'balloon', name: 'gameBalloon', desc: 'gameBalloonDesc' },
  { id: 'picture', name: 'gamePicture', desc: 'gamePictureDesc' },
]

const enter = (i: number) => ({ '--i': i }) as CSSProperties

export function GamesHub() {
  const lang = useSettingsStore((s) => s.lang)
  const best = useGamesStore((s) => s.best)
  const plays = useGamesStore((s) => s.plays)
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
          <SceneBackdrop variant="hub" />
          <div className="games-head kr-enter" style={enter(0)}>
            <TopBar
              back={{ href: '/', label: t(lang, 'gamesBack') }}
              title={
                <>
                  <Icon name="gamepad" size={28} /> {t(lang, 'gamesTitle')}
                </>
              }
            />
          </div>
          <div className="games-cards">
            {GAMES.map((g, i) => (
              <button
                key={g.id}
                type="button"
                className={`games-card games-card--${g.id} kr-enter`}
                style={enter(i + 1)}
                onClick={() => {
                  voice.unlockAudio()
                  voice.sound('pop')
                  setScreen(g.id)
                }}
              >
                <img
                  className="games-card-icon"
                  src={`/illustrations/game-${g.id}.svg`}
                  alt=""
                  width={120}
                  height={120}
                />
                <span className="games-card-name">{t(lang, g.name)}</span>
                <span className="games-card-desc">{t(lang, g.desc)}</span>
                <span className="games-card-best">
                  {(best[g.id] ?? 0) > 0 ? (
                    <Stars n={best[g.id] ?? 0} />
                  ) : (
                    <span className="games-card-new">
                      <Icon name="sparkle" size={18} /> {t(lang, 'gamesNew')}
                    </span>
                  )}
                </span>
                {(plays[g.id] ?? 0) > 0 && (
                  <span className="games-card-plays">
                    {tReplace(lang, 'gamePlays', plays[g.id] ?? 0)}
                  </span>
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
