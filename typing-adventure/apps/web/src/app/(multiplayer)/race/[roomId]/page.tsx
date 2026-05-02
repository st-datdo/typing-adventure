'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMultiplayer } from '@/hooks/useMultiplayer'
import { useSound } from '@/hooks/useSound'
import { useSpeech } from '@/hooks/useSpeech'
import { useSettingsStore } from '@/stores/settings-store'
import { RaceTrack } from '@/components/multiplayer/RaceTrack'
import { PlayerList } from '@/components/multiplayer/PlayerList'
import { CountdownTimer } from '@/components/multiplayer/CountdownTimer'
import { WordDisplay } from '@/components/game/WordDisplay'
import { Keyboard } from '@/components/game/Keyboard'
import type { GameState, Level } from '@typing-adventure/game-engine'

interface KeyFlash {
  key: string
  correct: boolean
  id: number
}

export default function RacePage() {
  const router = useRouter()
  const {
    state,
    userId,
    setReady,
    sendProgress,
    sendFinish,
    leaveRoom,
    reset,
  } = useMultiplayer()
  const { playCorrect, playWrong, playComplete } = useSound()
  const { speakLetter, speakWord } = useSpeech()
  const soundMode = useSettingsStore((s) => s.soundMode)

  const [localIndex, setLocalIndex] = useState(0)
  const [localWpm, setLocalWpm] = useState(0)
  const [localAccuracy, setLocalAccuracy] = useState(100)
  const [combo, setCombo] = useState(0)
  const [finished, setFinished] = useState(false)
  const [finishTimeSeconds, setFinishTimeSeconds] = useState(0)
  const [myRank, setMyRank] = useState<number | null>(null)
  const [lastKeyFlash, setLastKeyFlash] = useState<KeyFlash | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const correctKeysRef = useRef(0)
  const totalKeysRef = useRef(0)
  const localIndexRef = useRef(0)
  const flashIdRef = useRef(0)
  const hiddenInputRef = useRef<HTMLInputElement | null>(null)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Build a GameState-compatible object for WordDisplay and Keyboard.
  // Must be a new reference each render so WordDisplay can detect changes
  // via its internal prevIndexRef comparison.
  const gameState: GameState = {
    text: state.text,
    currentIndex: localIndex,
    startTime: startTimeRef.current,
    totalKeystrokes: totalKeysRef.current,
    correctKeystrokes: correctKeysRef.current,
    isFinished: finished,
    level: (state.level || 'easy') as Level,
    soundMode: 'default',
    gameMode: 'classic',
    wordBoundaries: [],
    combo,
    maxCombo: combo,
    score: 0,
    mistakeMap: {},
    lives: 3,
    challengeMistakes: 0,
    wordsCompleted: 0,
    timeAttackDuration: 0,
    timeRemaining: 0,
    lessonIndex: 0,
  }

  // Redirect if no room
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!state.roomId && state.connected) {
      redirectTimerRef.current = setTimeout(() => {
        if (!state.roomId) router.push('/lobby')
      }, 500)
    } else if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current)
      redirectTimerRef.current = null
    }
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current)
    }
  }, [state.roomId, state.connected, router])

  // Focus hidden input
  const focusInput = useCallback(() => {
    hiddenInputRef.current?.focus()
  }, [])

  // Trigger key flash
  const doFlash = useCallback((char: string, isCorrect: boolean) => {
    const keyName = char === ' ' ? ' ' : char.toLowerCase()
    flashIdRef.current++
    setLastKeyFlash({ key: keyName, correct: isCorrect, id: flashIdRef.current })
  }, [])

  // Setup racing state
  useEffect(() => {
    if (state.status === 'RACING') {
      focusInput()
      startTimeRef.current = state.raceStartTime ?? Date.now()
      correctKeysRef.current = 0
      totalKeysRef.current = 0

      progressIntervalRef.current = setInterval(() => {
        const elapsed = startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : 0
        const wpm = elapsed > 0 ? Math.round((correctKeysRef.current / 5) / (elapsed / 60)) : 0
        const acc = totalKeysRef.current > 0 ? Math.round((correctKeysRef.current / totalKeysRef.current) * 100) : 100
        setLocalWpm(wpm)
        setLocalAccuracy(acc)
        sendProgress(localIndexRef.current, wpm, acc)
      }, 250)
    }

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    }
  }, [state.status])

  // Process a single character input
  const processChar = useCallback((char: string) => {
    if (state.status !== 'RACING' || finished) return

    const expected = state.text[localIndexRef.current]
    totalKeysRef.current++
    const isCorrect = char === expected

    doFlash(char, isCorrect)

    if (isCorrect) {
      playCorrect()
      correctKeysRef.current++
      setCombo((c) => c + 1)
      const newIndex = localIndexRef.current + 1
      setLocalIndex(newIndex)

      // Speech based on soundMode setting
      if (soundMode === 'character' && char !== ' ') {
        speakLetter(char)
      } else if (soundMode === 'word') {
        // Detect if a word just completed (next char is space or end)
        const nextChar = state.text[newIndex]
        if (nextChar === ' ' || nextChar === undefined) {
          // Walk back to find the start of the completed word
          let start = newIndex - 1
          while (start > 0 && state.text[start - 1] !== ' ') {
            start--
          }
          const completedWord = state.text.slice(start, newIndex)
          if (completedWord) speakWord(completedWord)
        }
      }

      if (newIndex >= state.text.length) {
        setFinished(true)
        playComplete()
        const elapsed = startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : 0
        const wpm = elapsed > 0 ? Math.round((correctKeysRef.current / 5) / (elapsed / 60)) : 0
        const acc = totalKeysRef.current > 0 ? Math.round((correctKeysRef.current / totalKeysRef.current) * 100) : 100
        setFinishTimeSeconds(elapsed)
        setLocalWpm(wpm)
        setLocalAccuracy(acc)
        sendFinish(wpm, acc, elapsed)
      }
    } else {
      playWrong()
      setCombo(0)
    }

    if (hiddenInputRef.current) hiddenInputRef.current.value = ''
  }, [state.status, state.text, finished, doFlash, playCorrect, playWrong, playComplete, sendFinish, soundMode, speakLetter, speakWord])

  // Handle keyboard input
  useEffect(() => {
    if (state.status !== 'RACING' || finished) return

    const handleInput = (e: Event) => {
      const data = (e as InputEvent).data
      if (!data || data.length !== 1) return
      processChar(data)
    }

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault()
        processChar(' ')
      }
    }

    const input = hiddenInputRef.current
    input?.addEventListener('input', handleInput)
    document.addEventListener('keydown', handleKeydown)

    return () => {
      input?.removeEventListener('input', handleInput)
      document.removeEventListener('keydown', handleKeydown)
    }
  }, [state.status, finished, processChar])

  // Keep ref in sync
  useEffect(() => {
    localIndexRef.current = localIndex
  }, [localIndex])

  // Send progress on index change
  useEffect(() => {
    if (state.status === 'RACING' && !finished) {
      sendProgress(localIndex, localWpm, localAccuracy)
    }
  }, [localIndex])

  // Compute rank on finish
  useEffect(() => {
    if (!finished || !userId || myRank !== null) return
    const othersFinishedBefore = state.players.filter(
      (p) => p.finished && p.userId !== userId && !p.disconnected,
    )
    setMyRank(othersFinishedBefore.length + 1)
  }, [finished, userId, myRank, state.players])

  // Handle virtual keyboard click
  const handleKeyClick = useCallback((key: string) => {
    processChar(key)
    focusInput()
  }, [processChar, focusInput])

  const handleLeave = () => {
    leaveRoom()
    router.push('/lobby')
  }

  const handleBackToLobby = () => {
    reset()
    router.push('/lobby')
  }

  // ── COUNTDOWN ──
  if (state.status === 'COUNTDOWN' && state.countdownSeconds !== null) {
    return (
      <div className="mp-page">
        <CountdownTimer seconds={state.countdownSeconds} />
        <PlayerList players={state.players} currentUserId={userId} />
      </div>
    )
  }

  // ── RACING ──
  if (state.status === 'RACING') {
    const medals = ['🥇', '🥈', '🥉', '4️⃣']
    const othersStillRacing = state.players.filter(
      (p) => !p.finished && !p.disconnected && p.userId !== userId,
    )
    const otherPlayers = state.players.filter((p) => p.userId !== userId)

    return (
      <div className="mp-page mp-race-page" onClick={!finished ? focusInput : undefined}>
        <RaceTrack
          players={state.players}
          textLength={state.text.length}
          currentUserId={userId}
        />

        {!finished && (
          <>
            <div className="mp-race-stats">
              <span>{localWpm} WPM</span>
              <span>{localAccuracy}%</span>
            </div>

            <WordDisplay gameState={gameState} />

            <input
              ref={hiddenInputRef}
              type="text"
              className="hidden-input"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              autoFocus
            />

            <Keyboard
              gameState={gameState}
              onKeyClick={handleKeyClick}
              lastKeyFlash={lastKeyFlash}
            />
          </>
        )}

        {finished && (
          <div className="mp-finish-overlay">
            <div className="mp-finish-card">
              <div className="mp-finish-medal">
                {medals[(myRank ?? 1) - 1] ?? `#${myRank}`}
              </div>
              <h2 className="mp-finish-heading">
                {myRank === 1 ? 'Bạn về nhất!' : `Bạn xếp thứ ${myRank}`}
              </h2>

              <div className="mp-finish-stats">
                <div className="mp-finish-stat">
                  <span className="mp-finish-stat-value">{localWpm}</span>
                  <span className="mp-finish-stat-label">WPM</span>
                </div>
                <div className="mp-finish-stat">
                  <span className="mp-finish-stat-value">{localAccuracy}%</span>
                  <span className="mp-finish-stat-label">Accuracy</span>
                </div>
                <div className="mp-finish-stat">
                  <span className="mp-finish-stat-value">{finishTimeSeconds.toFixed(1)}s</span>
                  <span className="mp-finish-stat-label">Time</span>
                </div>
              </div>

              {otherPlayers.length > 0 && (
                <div className="mp-finish-waiting">
                  {othersStillRacing.length > 0 ? (
                    <p className="mp-finish-waiting-text">
                      Đang chờ {othersStillRacing.length} người chơi khác...
                    </p>
                  ) : (
                    <p className="mp-finish-waiting-text">
                      Tất cả đã hoàn thành! Đang tổng kết...
                    </p>
                  )}
                  <div className="mp-finish-others">
                    {otherPlayers.map((p) => {
                      const progress =
                        state.text.length > 0
                          ? Math.round((p.currentIndex / state.text.length) * 100)
                          : 0
                      return (
                        <div
                          key={p.userId}
                          className={`mp-finish-other-row ${p.finished ? 'mp-finish-other-done' : ''} ${p.disconnected ? 'mp-finish-other-dc' : ''}`}
                        >
                          <span className="mp-finish-other-avatar">{p.avatar}</span>
                          <span className="mp-finish-other-name">
                            {p.name}
                            {p.isHost && <span className="mp-host-badge mp-host-badge-sm">👑</span>}
                          </span>
                          <div className="mp-finish-other-bar">
                            <div
                              className="mp-finish-other-fill"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                          <span className="mp-finish-other-pct">
                            {p.disconnected ? '⚠️' : p.finished ? '🏁' : `${progress}%`}
                          </span>
                          <span className="mp-finish-other-wpm">
                            {p.disconnected ? 'DC' : `${p.wpm} WPM`}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {otherPlayers.length === 0 && (
                <p className="mp-finish-waiting-text">Đang tổng kết...</p>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── FINISHED ──
  if (state.status === 'FINISHED' && state.results) {
    const medals = ['🥇', '🥈', '🥉', '4️⃣']
    return (
      <div className="mp-page">
        <div className="mp-results">
          <h1 className="mp-title">🏁 Kết quả</h1>
          <div className="mp-results-table">
            {state.results.map((r, i) => {
              const player = state.players.find((p) => p.userId === r.userId)
              return (
                <div key={r.userId} className={`mp-result-row ${r.userId === userId ? 'mp-result-me' : ''}`}>
                  <span className="mp-result-rank">{medals[i] ?? `#${i + 1}`}</span>
                  <span className="mp-result-avatar">{player?.avatar ?? '🧒'}</span>
                  <span className="mp-result-name">
                    {player?.name ?? 'Player'}
                    {r.userId === userId && ' (bạn)'}
                  </span>
                  <span className="mp-result-wpm">{r.wpm} WPM</span>
                  <span className="mp-result-acc">{r.accuracy}%</span>
                  <span className="mp-result-time">
                    {r.finishTime ? `${r.finishTime.toFixed(1)}s` : 'DNF'}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="mp-actions">
            <button className="mp-btn mp-btn-primary" onClick={handleBackToLobby}>
              🏠 Về lobby
            </button>
            <Link href="/" className="mp-btn mp-btn-back">← Về game</Link>
          </div>
        </div>
      </div>
    )
  }

  // ── WAITING ──
  return (
    <div className="mp-page">
      <div className="mp-room">
        <h1 className="mp-title">🏁 Chờ bắt đầu...</h1>

        {state.code && (
          <div className="mp-room-code-wrap">
            <span className="mp-room-code-label">Mã phòng:</span>
            <span className="mp-room-code">{state.code}</span>
          </div>
        )}

        <PlayerList players={state.players} currentUserId={userId} />

        <div className="mp-actions">
          <button className="mp-btn mp-btn-primary mp-btn-lg" onClick={setReady}>
            ✋ Sẵn sàng!
          </button>
          <button className="mp-btn mp-btn-danger" onClick={handleLeave}>
            🚪 Rời phòng
          </button>
        </div>

        {state.error && <p className="mp-error">{state.error}</p>}
      </div>
    </div>
  )
}
