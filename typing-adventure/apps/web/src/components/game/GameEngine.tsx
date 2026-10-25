'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
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
import { CustomTextModal } from './CustomTextModal'
import { GuestBanner } from '@/components/auth/GuestBanner'
import { SyncIndicator } from '@/components/auth/SyncIndicator'
import { TopBar } from '@/components/ui/TopBar'

import { saveSession, getStats, getHistory } from '@/lib/api/sessions'
import { useRecordsStore } from '@/stores/records-store'
import { t } from '@typing-adventure/i18n'
import { isModeAllowed } from '@typing-adventure/game-engine'
import type { GameMode, Level } from '@typing-adventure/game-engine'

type Panel = 'none' | 'settings' | 'history' | 'achievements' | 'customText'

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
  const recordsStore = useRecordsStore()
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'saved' | 'offline'>('idle')
  const [panel, setPanel] = useState<Panel>('none')
  const [navOpen, setNavOpen] = useState(false)
  const closeNav = useCallback(() => setNavOpen(false), [])
  const flashIdRef = useRef(0)
  const [lastKeyFlash, setLastKeyFlash] = useState<{ key: string; correct: boolean; id: number } | null>(null)
  const profileLoadedRef = useRef<string | null>(null)
  const [selectedWordPackId, setSelectedWordPackId] = useState<string | null>(null)
  const [selectedWordPackWords, setSelectedWordPackWords] = useState<string[] | undefined>(undefined)

  useEffect(() => {
    if (!session?.user) {
      profileLoadedRef.current = null
      return
    }
    const userId = session.user.id
    if (!userId) return
    if (profileLoadedRef.current === userId) return
    profileLoadedRef.current = userId

    // Load records + history from DB
    Promise.all([
      getStats(),
      getHistory(1, 100),
    ]).then(([statsRes, historyRes]) => {
      if (!statsRes.success || !statsRes.data) return
      const serverHistory = historyRes.success && historyRes.data
        ? historyRes.data.map((s) => ({
            date: new Date(s.createdAt).toISOString(),
            level: s.level as Level,
            wpm: s.wpm,
            cps: s.cps,
            accuracy: s.accuracy,
            time: s.timeSeconds,
            wordCount: s.wordCount,
            score: s.score,
            stars: s.stars,
            maxCombo: s.maxCombo ?? 0,
          }))
        : []
      recordsStore.loadFromServer(statsRes.data, serverHistory)
    })
  }, [session])

  // Sign out handler: clear all local stores
  const handleSignOut = useCallback(() => {
    signOut().then(() => {
      settings.clearAll()
      recordsStore.clearAll()
    })
  }, [])

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

  // Flash key helper — reads fresh state from store
  const doFlash = useCallback((char: string) => {
    const { gameState: gs } = useGameStore.getState()
    const expected = gs.text[gs.currentIndex]
    if (expected === undefined) return
    const isCorrect = char === expected
    const keyName = char === ' ' ? ' ' : char.toLowerCase()
    flashIdRef.current++
    setLastKeyFlash({ key: keyName, correct: isCorrect, id: flashIdRef.current })
  }, [])

  // Keyboard input
  useEffect(() => {
    const handleInput = (e: Event) => {
      if (panel !== 'none') return
      const inputEvent = e as InputEvent
      const data = inputEvent.data
      if (data && data.length === 1) {
        doFlash(data)
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
        doFlash(' ')
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
  }, [handleKeypress, gameState.isFinished, panel, doFlash])

  // Auto-focus
  const focusInput = useCallback(() => {
    if (panel !== 'none') return
    hiddenInputRef.current?.focus()
  }, [panel])

  useEffect(() => {
    focusInput()
  }, [focusInput])

  useEffect(() => {
    if (!isModeAllowed(settings.ageGroup, gameState.gameMode)) {
      gameStore.startGame('classic', settings.level, settings.wordCount, 0, 60, selectedWordPackWords)
    }
  }, [settings.ageGroup, gameState.gameMode])

  const handleModeChange = useCallback((mode: GameMode) => {
    gameStore.startGame(mode, settings.level, settings.wordCount, 0, 60, selectedWordPackWords)
  }, [settings.level, settings.wordCount, selectedWordPackWords])

  const handleLevelChange = useCallback((level: Level) => {
    settings.setLevel(level)
    gameStore.startGame(gameState.gameMode, level, settings.wordCount, 0, gameState.timeAttackDuration, selectedWordPackWords)
  }, [gameState.gameMode, settings.wordCount, gameState.timeAttackDuration, selectedWordPackWords])

  const handleLessonChange = useCallback((index: number) => {
    gameStore.startGame('lesson', settings.level, settings.wordCount, index)
  }, [settings.level, settings.wordCount])

  const handleTimeAttackChange = useCallback((duration: number) => {
    gameStore.startGame('timeAttack', settings.level, settings.wordCount, 0, duration, selectedWordPackWords)
  }, [settings.level, settings.wordCount, selectedWordPackWords])

  const handlePlayAgain = useCallback(() => {
    gameStore.startGame(gameState.gameMode, settings.level, settings.wordCount, gameState.lessonIndex, gameState.timeAttackDuration, selectedWordPackWords)
    focusInput()
  }, [gameState.gameMode, settings.level, settings.wordCount, gameState.lessonIndex, gameState.timeAttackDuration, selectedWordPackWords, focusInput])

  const handleTryLevel = useCallback((level: string) => {
    settings.setLevel(level as Level)
    gameStore.startGame(gameState.gameMode, level as Level, settings.wordCount, 0, gameState.timeAttackDuration, selectedWordPackWords)
    focusInput()
  }, [gameState.gameMode, settings.wordCount, gameState.timeAttackDuration, selectedWordPackWords, focusInput])

  const handleWordPackChange = useCallback((packId: string | null, words: string[] | undefined) => {
    setSelectedWordPackId(packId)
    setSelectedWordPackWords(words)
    gameStore.startGame(gameState.gameMode, settings.level, settings.wordCount, gameState.lessonIndex, gameState.timeAttackDuration, words)
  }, [gameState.gameMode, settings.level, settings.wordCount, gameState.lessonIndex, gameState.timeAttackDuration])

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

  const lang = settings.lang
  const greetName = session?.user
    ? settings.playerName || session.user.name || session.user.email
    : settings.playerName
  const greetAvatar = session?.user
    ? settings.playerAvatar || session.user.image || '🧒'
    : settings.playerAvatar

  return (
    <div className="ta-screen" onClick={(e) => {
      const target = e.target as HTMLElement
      if (target.closest('.side-nav') || target.closest('.ui-topbar') || target.closest('.ui-overlay') || target.closest('.guest-banner') || target.tagName === 'SELECT' || target.tagName === 'BUTTON' || target.tagName === 'INPUT') return
      focusInput()
    }}>
      <SideNav
        open={navOpen}
        onClose={closeNav}
        gameMode={gameState.gameMode}
        lessonIndex={gameState.lessonIndex}
        timeAttackDuration={gameState.timeAttackDuration}
        selectedWordPackId={selectedWordPackId}
        onModeChange={handleModeChange}
        onLevelChange={handleLevelChange}
        onLessonChange={handleLessonChange}
        onTimeAttackChange={handleTimeAttackChange}
        onWordPackChange={handleWordPackChange}
        onOpenSettings={() => setPanel('settings')}
        onOpenHistory={() => setPanel('history')}
      />

      <div className="ta-head">
        <TopBar
          start={
            <button
              type="button"
              className="ui-chip"
              aria-label={t(lang, 'navMenu')}
              title={t(lang, 'navMenu')}
              aria-expanded={navOpen}
              aria-controls="side-nav"
              onClick={() => setNavOpen((o) => !o)}
            >
              ☰
            </button>
          }
          title="🦉 Typing Adventure"
          subtitle={t(lang, 'subtitle')}
          end={
            <>
              {greetName && (
                <span className="ui-chip ui-chip--text ta-profile" title={`${t(lang, 'greetHi')}, ${greetName}!`}>
                  <span aria-hidden>{greetAvatar}</span>
                  <span className="ta-profile-name">{greetName}</span>
                </span>
              )}
              {session?.user && (
                <button
                  type="button"
                  className="ui-chip"
                  aria-label={t(lang, 'btnSignOut')}
                  title={t(lang, 'btnSignOut')}
                  onClick={handleSignOut}
                >
                  🚪
                </button>
              )}
              <button
                type="button"
                className="ui-chip"
                aria-label={t(lang, 'tipRestart')}
                title={t(lang, 'tipRestart')}
                onClick={handlePlayAgain}
              >
                🔃
              </button>
              <button
                type="button"
                className="ui-chip"
                aria-label={t(lang, 'tipSound')}
                title={t(lang, 'tipSound')}
                aria-pressed={settings.soundEnabled}
                onClick={() => settings.setSoundEnabled(!settings.soundEnabled)}
              >
                {settings.soundEnabled ? '🔊' : '🔇'}
              </button>
            </>
          }
        />
      </div>

      <main className="main">
        <StatsBar gameState={gameState} />
        <WordDisplay gameState={gameState} onCustomText={() => setPanel('customText')} />
        <Keyboard gameState={gameState} onKeyClick={handleKeyClick} lastKeyFlash={lastKeyFlash} />
        <HandGuide gameState={gameState} />
        <GuestBanner />
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

      {panel === 'customText' && (
        <CustomTextModal
          onStart={(text) => {
            gameStore.startCustomGame(text, settings.level)
            setPanel('none')
            focusInput()
          }}
          onClose={() => { setPanel('none'); focusInput() }}
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

      <SyncIndicator status={syncStatus} />
    </div>
  )
}
