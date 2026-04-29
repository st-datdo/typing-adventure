'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useGameStore } from '@/stores/game-store'
import { useSettingsStore } from '@/stores/settings-store'
import { useRecordsStore } from '@/stores/records-store'
import { useSound } from '@/hooks/useSound'
import { useSpeech } from '@/hooks/useSpeech'
import { checkAchievements, formatTime } from '@typing-adventure/game-engine'

export function useGameEngine() {
  const gameStore = useGameStore()
  const settings = useSettingsStore()
  const recordsStore = useRecordsStore()
  const { playCorrect, playWrong, playComplete, playClick } = useSound()
  const { speakLetter, speakWord, cancel: cancelSpeech } = useSpeech()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hiddenInputRef = useRef<HTMLInputElement | null>(null)

  const { gameState, result, showCelebration } = gameStore

  // Timer
  useEffect(() => {
    if (gameState.startTime && !gameState.isFinished) {
      timerRef.current = setInterval(() => {
        if (gameState.gameMode === 'timeAttack' && gameState.startTime) {
          const elapsed = (Date.now() - gameState.startTime) / 1000
          const remaining = Math.max(0, gameState.timeAttackDuration - elapsed)
          gameStore.updateTimeRemaining(remaining)
          if (remaining <= 0) {
            gameStore.finishGame()
          }
        }
      }, 100)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [gameState.startTime, gameState.isFinished, gameState.gameMode, gameState.timeAttackDuration])

  // Save result when game finishes
  useEffect(() => {
    if (result && showCelebration) {
      playComplete()

      recordsStore.addHistory({
        date: new Date().toISOString(),
        level: gameState.level,
        wpm: result.wpm,
        cps: result.cps,
        accuracy: result.accuracy,
        time: result.timeSeconds,
        wordCount: result.wordCount,
        score: result.score,
        stars: result.stars,
        maxCombo: result.maxCombo,
      })

      recordsStore.updateRecords(
        gameState.level,
        result.wpm,
        result.accuracy,
        result.wordCount,
        result.score,
      )

      // Check achievements
      const newUnlocks = checkAchievements(
        recordsStore.records,
        recordsStore.history,
        recordsStore.unlockedAchievements,
      )
      if (newUnlocks.length > 0) {
        recordsStore.unlockAchievements(newUnlocks)
      }
    }
  }, [result, showCelebration])

  const handleKeypress = useCallback((char: string) => {
    if (gameState.isFinished) return

    // Start timer on first keypress
    if (!gameState.startTime) {
      gameStore.setStartTime(Date.now())
    }

    const { isCorrect, completedWord, isMilestone } = gameStore.handleKeypress(char)

    if (isCorrect) {
      playCorrect()
      if (settings.soundMode === 'character' && char !== ' ') {
        speakLetter(char)
      } else if (settings.soundMode === 'word' && completedWord && char !== ' ') {
        speakWord(completedWord)
      }
    } else {
      playWrong()
    }
  }, [gameState.isFinished, gameState.startTime, settings.soundMode])

  const resetGame = useCallback(() => {
    cancelSpeech()
    gameStore.startGame(
      gameState.gameMode,
      settings.level,
      settings.wordCount,
      gameState.lessonIndex,
      gameState.timeAttackDuration,
    )
  }, [gameState.gameMode, settings.level, settings.wordCount, gameState.lessonIndex, gameState.timeAttackDuration])

  const focusInput = useCallback(() => {
    hiddenInputRef.current?.focus()
  }, [])

  const getElapsedSeconds = useCallback((): number => {
    if (!gameState.startTime) return 0
    return (Date.now() - gameState.startTime) / 1000
  }, [gameState.startTime])

  const getDisplayTime = useCallback((): string => {
    if (gameState.gameMode === 'timeAttack') {
      return formatTime(gameState.timeRemaining)
    }
    return formatTime(getElapsedSeconds())
  }, [gameState.gameMode, gameState.timeRemaining, getElapsedSeconds])

  const getLiveStats = useCallback(() => {
    const elapsed = getElapsedSeconds()
    const cps = elapsed > 0 ? gameState.correctKeystrokes / elapsed : 0
    const wpm = elapsed > 0
      ? Math.round((gameState.correctKeystrokes / 5) / (elapsed / 60))
      : 0
    const accuracy = gameState.totalKeystrokes > 0
      ? Math.round((gameState.correctKeystrokes / gameState.totalKeystrokes) * 100)
      : 100
    return { cps: cps.toFixed(2), wpm, accuracy }
  }, [getElapsedSeconds, gameState.correctKeystrokes, gameState.totalKeystrokes])

  return {
    gameState,
    result,
    showCelebration,
    handleKeypress,
    resetGame,
    focusInput,
    hiddenInputRef,
    getDisplayTime,
    getLiveStats,
  }
}
