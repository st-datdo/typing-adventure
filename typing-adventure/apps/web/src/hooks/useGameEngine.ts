'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useGameStore } from '@/stores/game-store'
import { useSettingsStore } from '@/stores/settings-store'
import { useRecordsStore } from '@/stores/records-store'
import { useComboCelebrationStore } from '@/stores/combo-celebration-store'
import { useFxStore } from '@/stores/fx-store'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { effectiveLevel } from '@/lib/fx/levels'
import { soundCue } from '@/lib/fx/tiers'
import { useSound } from '@/hooks/useSound'
import { useSpeech } from '@/hooks/useSpeech'
import { checkAchievements, formatTime } from '@typing-adventure/game-engine'

export function useGameEngine() {
  const gameStore = useGameStore()
  const settings = useSettingsStore()
  const recordsStore = useRecordsStore()
  const { play, playStep, playWrong, playComplete, playClick } = useSound()
  const reducedMotion = usePrefersReducedMotion()
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

  useEffect(() => {
    if (gameState.startTime === null) {
      useComboCelebrationStore.getState().clear()
      useFxStore.getState().reset()
    }
  }, [gameState.startTime])

  useEffect(() => {
    useFxStore
      .getState()
      .dispatch({ type: 'level', value: effectiveLevel(settings.effectsLevel, reducedMotion) })
  }, [settings.effectsLevel, reducedMotion])

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

  const handleKeypress = useCallback(
    (char: string) => {
      if (gameState.isFinished) return

      // Start timer on first keypress
      if (!gameState.startTime) {
        gameStore.setStartTime(Date.now())
      }

      const before = useGameStore.getState().gameState
      const { isCorrect, completedWord, isMilestone } = gameStore.handleKeypress(char)

      const celebration = useComboCelebrationStore.getState()
      const fx = useFxStore.getState()
      const after = useGameStore.getState().gameState
      if (after.isFinished) {
        celebration.finish()
        fx.reset()
      } else {
        if (isMilestone) celebration.celebrate(after.combo)
        let word: [number, number] | null = null
        if (completedWord && char !== ' ') {
          let start = before.currentIndex
          while (start > 0 && before.text[start - 1] !== ' ') start--
          word = [start, before.currentIndex + 1]
        }
        fx.dispatch({
          type: 'key',
          correct: isCorrect,
          combo: after.combo,
          index: before.currentIndex,
          char,
          word,
          now: Date.now(),
        })
      }

      if (isCorrect) {
        const cue = soundCue(after.combo)
        if (cue.kind === 'tier') play(cue.sound)
        else playStep(cue.step)
        if (settings.soundMode === 'character' && char !== ' ') {
          speakLetter(char)
        } else if (settings.soundMode === 'word' && completedWord && char !== ' ') {
          speakWord(completedWord)
        }
      } else {
        playWrong()
      }
    },
    [gameState.isFinished, gameState.startTime, settings.soundMode],
  )

  const resetGame = useCallback(() => {
    cancelSpeech()
    const { customWords } = useGameStore.getState()
    gameStore.startGame(
      gameState.gameMode,
      settings.level,
      settings.wordCount,
      gameState.lessonIndex,
      gameState.timeAttackDuration,
      customWords,
    )
  }, [
    gameState.gameMode,
    settings.level,
    settings.wordCount,
    gameState.lessonIndex,
    gameState.timeAttackDuration,
  ])

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
    const wpm = elapsed > 0 ? Math.round(gameState.correctKeystrokes / 5 / (elapsed / 60)) : 0
    const accuracy =
      gameState.totalKeystrokes > 0
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
