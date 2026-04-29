'use client'

import { useEffect, useCallback } from 'react'
import { useGameEngine } from '@/hooks/useGameEngine'
import { useGameStore } from '@/stores/game-store'
import { useSettingsStore } from '@/stores/settings-store'
import { WordDisplay } from './WordDisplay'
import { Keyboard } from './Keyboard'
import { HandGuide } from './HandGuide'
import { StatsBar } from './StatsBar'
import { CelebrationModal } from './CelebrationModal'
import { SideNav } from '@/components/layout/SideNav'
import { t } from '@typing-adventure/i18n'
import type { GameMode, Level } from '@typing-adventure/game-engine'

export function GameEngine() {
  const {
    gameState,
    result,
    showCelebration,
    handleKeypress,
    resetGame,
    hiddenInputRef,
  } = useGameEngine()

  const gameStore = useGameStore()
  const settings = useSettingsStore()

  // Keyboard input
  useEffect(() => {
    const handleInput = (e: Event) => {
      const inputEvent = e as InputEvent
      if (document.querySelector('.settings-overlay.settings--visible')) return
      const data = inputEvent.data
      if (data && data.length === 1) {
        handleKeypress(data)
      }
      if (hiddenInputRef.current) {
        hiddenInputRef.current.value = ''
      }
    }

    const handleKeydown = (e: KeyboardEvent) => {
      if (document.querySelector('.settings-overlay.settings--visible')) return
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
  }, [handleKeypress, gameState.isFinished])

  // Auto-focus
  const focusInput = useCallback(() => {
    hiddenInputRef.current?.focus()
  }, [])

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

  const handlePlayAgain = useCallback(() => {
    gameStore.startGame(gameState.gameMode, settings.level, settings.wordCount, gameState.lessonIndex, gameState.timeAttackDuration)
    focusInput()
  }, [gameState.gameMode, settings.level, settings.wordCount, gameState.lessonIndex, gameState.timeAttackDuration])

  const handleTryLevel = useCallback((level: string) => {
    settings.setLevel(level as Level)
    gameStore.startGame(gameState.gameMode, level as Level, settings.wordCount)
    focusInput()
  }, [gameState.gameMode, settings.wordCount])

  const handlePracticeWeak = useCallback((chars: string[]) => {
    const allWords = ['cat', 'dog', 'sun', 'hat', 'big', 'run', 'fun', 'apple', 'happy', 'tiger']
    const matching = allWords.filter(w => chars.some(ch => w.includes(ch)))
    const text = (matching.length > 0 ? matching : allWords).slice(0, 10).join(' ')
    gameStore.startCustomGame(text, settings.level)
    focusInput()
  }, [settings.level])

  const handleKeyClick = useCallback((key: string) => {
    handleKeypress(key)
    focusInput()
  }, [handleKeypress, focusInput])

  return (
    <div onClick={focusInput}>
      <SideNav
        gameMode={gameState.gameMode}
        onModeChange={handleModeChange}
        onLevelChange={handleLevelChange}
        onRestart={handlePlayAgain}
      />

      <header className="header">
        <h1 className="title">
          <span className="title-icon">🎹</span>
          Typing Adventure
          <span className="title-icon">✨</span>
        </h1>
        <p className="subtitle">{t(settings.lang, 'subtitle')}</p>
        {settings.playerName && (
          <p className="profile-greeting">
            {settings.playerAvatar} {settings.lang === 'vi' ? 'Chào' : 'Hi'}, {settings.playerName}!
          </p>
        )}
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

      <input
        ref={hiddenInputRef}
        type="text"
        className="hidden-input"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />
    </div>
  )
}
