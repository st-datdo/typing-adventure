'use client'

import type { GameState, GameResult } from '@typing-adventure/game-engine'
import { formatTime, LESSONS } from '@typing-adventure/game-engine'
import { useSettingsStore } from '@/stores/settings-store'
import { useRecordsStore } from '@/stores/records-store'
import { t, tReplace } from '@typing-adventure/i18n'

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
  const lang = useSettingsStore(s => s.lang)
  const records = useRecordsStore(s => s.records)

  const prevBestWpm = records.bestWpm[gameState.level] ?? 0
  const isNewRecord = result.wpm > 0 && result.wpm >= prevBestWpm

  let emoji = '🥳'
  let title = t(lang, 'celExcellent')
  if (gameState.gameMode === 'challenge' && gameState.lives <= 0) {
    emoji = '😵'
    title = t(lang, 'celOutOfLives')
  } else if (gameState.gameMode === 'timeAttack') {
    emoji = '⏰'
    title = t(lang, 'celTimeUp')
  }

  const starDisplay = '★'.repeat(result.stars) + '☆'.repeat(3 - result.stars)

  const mistakes = Object.entries(result.mistakeMap).sort((a, b) => b[1] - a[1])
  const top3 = mistakes.slice(0, 3)

  const nextLevel: Record<string, string> = { easy: 'medium', medium: 'hard' }
  const showLevelUp = result.stars === 3 && nextLevel[gameState.level]

  return (
    <div className="celebration celebration--visible">
      <div className="celebration-content">
        <div className="celebration-emoji">{emoji}</div>
        <h2>{title}</h2>

        <div className="celebration-stars">{starDisplay}</div>
        <div className="celebration-score">
          {result.score.toLocaleString()} {t(lang, 'celPoints')}
        </div>

        <div className="celebration-record">
          {isNewRecord && (
            <span className="new-record">{t(lang, 'celNewRecord')}</span>
          )}
          {!isNewRecord && prevBestWpm > 0 && (prevBestWpm - result.wpm) <= 5 && (prevBestWpm - result.wpm) > 0 && (
            <span className="record-close">
              {tReplace(lang, 'celAlmostRecord', prevBestWpm - result.wpm)}
            </span>
          )}
          <span className="record-info">
            🎮 {tReplace(lang, 'gamesPlayed', records.totalGames)} | 🔥 {records.dayStreak} {t(lang, 'celConsecutive')}
          </span>
        </div>

        <div className="celebration-stats-grid">
          <div className="cstat">
            <span className="cstat-val">{formatTime(result.timeSeconds)}</span>
            <span className="cstat-lbl">{t(lang, 'lblTimeStat')}</span>
          </div>
          <div className="cstat">
            <span className="cstat-val">{result.cps}</span>
            <span className="cstat-lbl">CPS</span>
          </div>
          <div className="cstat">
            <span className="cstat-val">{result.wpm}</span>
            <span className="cstat-lbl">WPM</span>
          </div>
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
              <span className="cstat-val">{'❤️'.repeat(gameState.lives)}</span>
              <span className="cstat-lbl">{t(lang, 'lblLivesLeft')}</span>
            </div>
          )}
          {gameState.gameMode === 'lesson' && (
            <div className="cstat">
              <span className="cstat-val">{(LESSONS[gameState.lessonIndex] ?? LESSONS[0]).name}</span>
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

        <div className="celebration-actions">
          <button className="btn btn-restart" onClick={onPlayAgain}>
            {t(lang, 'btnPlayAgain')}
          </button>
          {showLevelUp && (
            <button
              className="btn btn-level-up"
              onClick={() => onTryLevel(nextLevel[gameState.level])}
            >
              {tReplace(lang, 'btnTryLevel',
                gameState.level === 'easy' ? t(lang, 'lvLabelMedium') : t(lang, 'lvLabelHard')
              )}
            </button>
          )}
          {top3.length > 0 && (
            <button
              className="btn btn-practice"
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
