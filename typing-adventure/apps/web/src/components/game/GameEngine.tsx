'use client'

import { useEffect, useCallback, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useGameEngine } from '@/hooks/useGameEngine'
import { useGameStore } from '@/stores/game-store'
import { useSettingsStore } from '@/stores/settings-store'
import { WordDisplay } from './WordDisplay'
import { Keyboard } from './Keyboard'
import { HandGuide } from './HandGuide'
import { StatsBar } from './StatsBar'
import { CelebrationModal } from './CelebrationModal'
import { SideNav } from '@/components/layout/SideNav'
import { SettingsPanel } from '@/components/settings/SettingsPanel'
import { HistoryPanel } from '@/components/history/HistoryPanel'
import { AchievementGrid } from '@/components/achievements/AchievementGrid'
import { GuestBanner } from '@/components/auth/GuestBanner'
import { SyncIndicator } from '@/components/auth/SyncIndicator'
import { MigrateDialog } from '@/components/auth/MigrateDialog'
import { saveSession } from '@/lib/api/sessions'
import { t } from '@typing-adventure/i18n'
import type { GameMode, Level } from '@typing-adventure/game-engine'

type Panel = 'none' | 'settings' | 'history' | 'achievements'

export function GameEngine() {
  const {
    gameState,
    result,
    showCelebration,
    handleKeypress,
    resetGame,
    hiddenInputRef,
  } = useGameEngine()

  const { data: session } = useSession()
  const gameStore = useGameStore()
  const settings = useSettingsStore()
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'saved' | 'offline'>('idle')
  const [panel, setPanel] = useState<Panel>('none')

  // Save result to server when game finishes (if logged in)
  useEffect(() => {
    if (!result || !showCelebration || !session) return
    setSyncStatus('syncing')
    saveSession({
      gameMode: gameState.gameMode,
      level: gameState.level,
      wpm: result.wpm,
      cps: result.cps,
      accuracy: result.accuracy,
      score: result.score,
      stars: result.stars,
      timeSeconds: result.timeSeconds,
      wordCount: result.wordCount,
      maxCombo: result.maxCombo,
      mistakeMap: result.mistakeMap,
    }).then((res) => {
      setSyncStatus(res.success ? 'saved' : 'offline')
    }).catch(() => {
      setSyncStatus('offline')
    })
  }, [result, showCelebration, session])

  // Keyboard input
  useEffect(() => {
    const handleInput = (e: Event) => {
      if (panel !== 'none') return
      const inputEvent = e as InputEvent
      const data = inputEvent.data
      if (data && data.length === 1) {
        handleKeypress(data)
      }
      if (hiddenInputRef.current) {
        hiddenInputRef.current.value = ''
      }
    }

    const handleKeydown = (e: KeyboardEvent) => {
      if (panel !== 'none') return
      if (gameState.isFinished) return
      if (e.key === ' ') {
        e.preventDefault()
        handleKeypress(' ')
      }
    }

    const input = hiddenInputRef.current
    input?.addEventListener('input', handleInput)
    document.addEventListener('keydown', handleKeydown)

    return () => {
      input?.removeEventListener('input', handleInput)
      document.removeEventListener('keydown', handleKeydown)
    }
  }, [handleKeypress, gameState.isFinished, panel])

  // Auto-focus
  const focusInput = useCallback(() => {
    if (panel !== 'none') return
    hiddenInputRef.current?.focus()
  }, [panel])

  useEffect(() => {
    focusInput()
  }, [focusInput])

  // Apply theme
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.removeAttribute('data-theme')
    } else {
      document.documentElement.setAttribute('data-theme', settings.theme)
    }
  }, [settings.theme])

  const handleModeChange = useCallback((mode: GameMode) => {
    gameStore.startGame(mode, settings.level, settings.wordCount)
  }, [settings.level, settings.wordCount])

  const handleLevelChange = useCallback((level: Level) => {
    settings.setLevel(level)
    gameStore.startGame(gameState.gameMode, level, settings.wordCount)
  }, [gameState.gameMode, settings.wordCount])

  const handleLessonChange = useCallback((index: number) => {
    gameStore.startGame('lesson', settings.level, settings.wordCount, index)
  }, [settings.level, settings.wordCount])

  const handleTimeAttackChange = useCallback((duration: number) => {
    gameStore.startGame('timeAttack', settings.level, settings.wordCount, 0, duration)
  }, [settings.level, settings.wordCount])

  const handlePlayAgain = useCallback(() => {
    gameStore.startGame(gameState.gameMode, settings.level, settings.wordCount, gameState.lessonIndex, gameState.timeAttackDuration)
    focusInput()
  }, [gameState.gameMode, settings.level, settings.wordCount, gameState.lessonIndex, gameState.timeAttackDuration, focusInput])

  const handleTryLevel = useCallback((level: string) => {
    settings.setLevel(level as Level)
    gameStore.startGame(gameState.gameMode, level as Level, settings.wordCount)
    focusInput()
  }, [gameState.gameMode, settings.wordCount, focusInput])

  const handlePracticeWeak = useCallback((chars: string[]) => {
    const allWords = ['cat', 'dog', 'sun', 'hat', 'big', 'run', 'fun', 'apple', 'happy', 'tiger']
    const matching = allWords.filter(w => chars.some(ch => w.includes(ch)))
    const text = (matching.length > 0 ? matching : allWords).slice(0, 10).join(' ')
    gameStore.startCustomGame(text, settings.level)
    focusInput()
  }, [settings.level, focusInput])

  const handleKeyClick = useCallback((key: string) => {
    handleKeypress(key)
    focusInput()
  }, [handleKeypress, focusInput])

  return (
    <div onClick={(e) => {
      // Không focus hidden input khi click vào select/button/input trong nav
      const target = e.target as HTMLElement
      if (target.closest('.side-nav') || target.closest('.quick-actions') || target.closest('.settings-overlay') || target.closest('.celebration') || target.tagName === 'SELECT' || target.tagName === 'BUTTON' || target.tagName === 'INPUT') return
      focusInput()
    }}>
      <SideNav
        gameMode={gameState.gameMode}
        lessonIndex={gameState.lessonIndex}
        timeAttackDuration={gameState.timeAttackDuration}
        onModeChange={handleModeChange}
        onLevelChange={handleLevelChange}
        onLessonChange={handleLessonChange}
        onTimeAttackChange={handleTimeAttackChange}
        onRestart={handlePlayAgain}
        onOpenSettings={() => setPanel('settings')}
        onOpenHistory={() => setPanel('history')}
      />

      <header className="header">
        <h1 className="title">
          <span className="title-icon">🎹</span>
          Typing Adventure
          <span className="title-icon">✨</span>
        </h1>
        <p className="subtitle">{t(settings.lang, 'subtitle')}</p>
        {session?.user ? (
          <p className="profile-greeting">
            {(session.user as any).image ?? '🧒'}{' '}
            {settings.lang === 'vi' ? 'Chào' : 'Hi'}, {session.user.name ?? session.user.email}!
            <button
              className="btn"
              style={{ marginLeft: 8, fontSize: '0.75rem', padding: '4px 10px' }}
              onClick={() => signOut()}
            >
              Đăng xuất
            </button>
          </p>
        ) : settings.playerName ? (
          <p className="profile-greeting">
            {settings.playerAvatar} {settings.lang === 'vi' ? 'Chào' : 'Hi'}, {settings.playerName}!
          </p>
        ) : null}
      </header>

      <main className="main">
        <StatsBar gameState={gameState} />
        <WordDisplay gameState={gameState} />
        <Keyboard gameState={gameState} onKeyClick={handleKeyClick} />
        <HandGuide gameState={gameState} />
      </main>

      {showCelebration && result && (
        <CelebrationModal
          gameState={gameState}
          result={result}
          onPlayAgain={handlePlayAgain}
          onTryLevel={handleTryLevel}
          onPracticeWeak={handlePracticeWeak}
        />
      )}

      {panel === 'settings' && (
        <SettingsPanel
          onClose={() => { setPanel('none'); focusInput() }}
          onOpenAchievements={() => setPanel('achievements')}
        />
      )}

      {panel === 'history' && (
        <HistoryPanel onClose={() => { setPanel('none'); focusInput() }} />
      )}

      {panel === 'achievements' && (
        <AchievementGrid onClose={() => { setPanel('settings'); }} />
      )}

      <input
        ref={hiddenInputRef}
        type="text"
        className="hidden-input"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />

      <GuestBanner />
      <SyncIndicator status={syncStatus} />
      <MigrateDialog />
    </div>
  )
}
