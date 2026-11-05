'use client'

import type { GameState, GameResult } from '@typing-adventure/game-engine'
import { formatTime, LESSONS, AGE_PROFILES } from '@typing-adventure/game-engine'
import { useSettingsStore } from '@/stores/settings-store'
import { useRecordsStore } from '@/stores/records-store'
import { t, tReplace } from '@typing-adventure/i18n'
import { useEffect, useRef, type CSSProperties } from 'react'
import { OwlMascot } from '@/components/mascot/OwlMascot'
import { Icon } from '@/components/ui/icons/Icon'
import { Confetti } from '@/components/ui/Confetti'
import { Stars } from '@/components/games/Stars'
import { resultCelebration } from '@/lib/kr/result-celebration'

const enter = (i: number) => ({ '--i': i }) as CSSProperties

interface CelebrationModalProps {
  gameState: GameState
  result: GameResult
  onPlayAgain: () => void
  onTryLevel: (level: string) => void
  onPracticeWeak: (chars: string[]) => void
}

export function CelebrationModal({
  gameState,
  result,
  onPlayAgain,
  onTryLevel,
  onPracticeWeak,
}: CelebrationModalProps) {
  const lang = useSettingsStore((s) => s.lang)
  const ageGroup = useSettingsStore((s) => s.ageGroup)
  const showSpeed = ageGroup === null || AGE_PROFILES[ageGroup].showSpeedStats
  const records = useRecordsStore((s) => s.records)

  const prevBestWpm = records.bestWpm[gameState.level] ?? 0
  const isNewRecord = result.wpm > 0 && result.wpm >= prevBestWpm

  const dialogRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    dialogRef.current?.focus()
  }, [])

  let title = t(lang, 'celExcellent')
  if (gameState.gameMode === 'challenge' && gameState.lives <= 0) {
    title = t(lang, 'celOutOfLives')
  } else if (gameState.gameMode === 'timeAttack') {
    title = t(lang, 'celTimeUp')
  }

  const fx = resultCelebration({
    mode: gameState.gameMode,
    lives: gameState.lives,
    stars: result.stars,
  })

  const mistakes = Object.entries(result.mistakeMap).sort((a, b) => b[1] - a[1])
  const top3 = mistakes.slice(0, 3)

  const nextLevel: Record<string, string> = { easy: 'medium', medium: 'hard' }
  const showLevelUp = result.stars === 3 && nextLevel[gameState.level]

  return (
    <div className="ui-overlay ta-celebration">
      <div
        className="ui-modal ta-modal celebration-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="celebration-title"
        tabIndex={-1}
        ref={dialogRef}
      >
        {fx.confetti && <Confetti seed={result.score + result.maxCombo} />}
        <div className="celebration-hero kr-enter" style={enter(0)}>
          <OwlMascot mood={fx.mood} size="lg" />
          {fx.clock && (
            <img
              className="celebration-clock"
              src="/illustrations/result-clock.svg"
              alt=""
              width={64}
              height={64}
            />
          )}
        </div>
        <h2 id="celebration-title" className="celebration-title kr-enter" style={enter(1)}>
          {title}
        </h2>

        <div className="celebration-stars kr-enter" style={enter(2)}>
          <Stars n={result.stars} size="lg" animate />
        </div>
        <div className="celebration-score kr-enter" style={enter(3)}>
          {result.score.toLocaleString()} {t(lang, 'celPoints')}
        </div>

        <div className="celebration-record">
          {showSpeed && isNewRecord && (
            <span className="new-record record-shine">{t(lang, 'celNewRecord')}</span>
          )}
          {showSpeed &&
            !isNewRecord &&
            prevBestWpm > 0 &&
            prevBestWpm - result.wpm <= 5 &&
            prevBestWpm - result.wpm > 0 && (
              <span className="record-close">
                {tReplace(lang, 'celAlmostRecord', prevBestWpm - result.wpm)}
              </span>
            )}
          <span className="record-info">
            <Icon name="gamepad" size={18} /> {tReplace(lang, 'gamesPlayed', records.totalGames)} |{' '}
            <Icon name="flame" size={18} /> {records.dayStreak} {t(lang, 'celConsecutive')}
          </span>
        </div>

        <div className="celebration-stats-grid kr-enter" style={enter(4)}>
          <div className="cstat">
            <span className="cstat-val">{formatTime(result.timeSeconds)}</span>
            <span className="cstat-lbl">{t(lang, 'lblTimeStat')}</span>
          </div>
          {showSpeed && (
            <>
              <div className="cstat">
                <span className="cstat-val">{result.cps}</span>
                <span className="cstat-lbl">CPS</span>
              </div>
              <div className="cstat">
                <span className="cstat-val">{result.wpm}</span>
                <span className="cstat-lbl">WPM</span>
              </div>
            </>
          )}
          <div className="cstat">
            <span className="cstat-val">{result.accuracy}%</span>
            <span className="cstat-lbl">{t(lang, 'lblAccStat')}</span>
          </div>
          <div className="cstat">
            <span className="cstat-val">x{result.maxCombo}</span>
            <span className="cstat-lbl">Max Combo</span>
          </div>
          <div className="cstat">
            <span className="cstat-val">{result.score.toLocaleString()}</span>
            <span className="cstat-lbl">{t(lang, 'lblPointsStat')}</span>
          </div>
          {gameState.gameMode === 'timeAttack' && (
            <div className="cstat">
              <span className="cstat-val">{gameState.wordsCompleted}</span>
              <span className="cstat-lbl">{t(lang, 'lblWordsCompleted')}</span>
            </div>
          )}
          {gameState.gameMode === 'challenge' && (
            <div className="cstat">
              <span
                className="cstat-val cstat-lives"
                role="img"
                aria-label={tReplace(lang, 'livesLabel', gameState.lives)}
              >
                {Array.from({ length: gameState.lives }, (_, i) => (
                  <Icon key={i} name="heart" size={20} />
                ))}
              </span>
              <span className="cstat-lbl">{t(lang, 'lblLivesLeft')}</span>
            </div>
          )}
          {gameState.gameMode === 'lesson' && (
            <div className="cstat">
              <span className="cstat-val">
                {(LESSONS[gameState.lessonIndex] ?? LESSONS[0]).name}
              </span>
              <span className="cstat-lbl">{t(lang, 'lblLesson')}</span>
            </div>
          )}
        </div>

        <div className="celebration-mistakes">
          {top3.length > 0 ? (
            <>
              <div className="mistakes-title">{t(lang, 'mistakeTitle')}</div>
              <div className="mistakes-list">
                {top3.map(([ch, count]) => (
                  <span key={ch} className="mistake-char">
                    {ch.toUpperCase()} <small>({count}x)</small>
                  </span>
                ))}
              </div>
              <div className="mistakes-tip">
                {tReplace(lang, 'mistakeTip', top3.map(([ch]) => ch.toUpperCase()).join(', '))}
              </div>
            </>
          ) : (
            <div className="mistakes-title perfect">{t(lang, 'mistakePerfect')}</div>
          )}
        </div>

        <div className="celebration-actions kr-enter" style={enter(5)}>
          <button type="button" className="ui-btn ui-btn--go" onClick={onPlayAgain}>
            {t(lang, 'btnPlayAgain')}
          </button>
          {showLevelUp && (
            <button
              type="button"
              className="ui-btn ui-btn--sun"
              onClick={() => onTryLevel(nextLevel[gameState.level])}
            >
              {tReplace(
                lang,
                'btnTryLevel',
                gameState.level === 'easy' ? t(lang, 'lvLabelMedium') : t(lang, 'lvLabelHard'),
              )}
            </button>
          )}
          {top3.length > 0 && (
            <button
              type="button"
              className="ui-btn"
              onClick={() => onPracticeWeak(mistakes.slice(0, 5).map(([ch]) => ch))}
            >
              {t(lang, 'btnPracticeWeak')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
