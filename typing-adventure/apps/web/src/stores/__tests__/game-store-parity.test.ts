import { describe, expect, it } from 'vitest'
import { createInitialState, processKeypress } from '@typing-adventure/game-engine'
import { useGameStore } from '../game-store'

describe('game store parity', () => {
  it('KR-21 KR-15 store keypress results match the pure engine', () => {
    useGameStore.getState().startGame('classic', 'easy', 5)
    let engineState = { ...useGameStore.getState().gameState }
    const now = Date.now()
    useGameStore.getState().setStartTime(now)
    engineState = { ...engineState, startTime: now }
    const text = engineState.text
    const keys: string[] = []
    for (let i = 0; i < Math.min(text.length, 14); i++) {
      if (i === 3 || i === 8) keys.push('#')
      keys.push(text[i])
    }
    const milestones: number[] = []
    for (const k of keys) {
      const r = useGameStore.getState().handleKeypress(k)
      engineState = processKeypress(engineState, k).newState
      if (r.isMilestone) milestones.push(useGameStore.getState().gameState.combo)
    }
    const s = useGameStore.getState().gameState
    for (const f of [
      'score',
      'combo',
      'maxCombo',
      'correctKeystrokes',
      'totalKeystrokes',
    ] as const) {
      expect(s[f], f).toBe(engineState[f])
    }
    expect(s.mistakeMap).toEqual(engineState.mistakeMap)
    expect(milestones.every((m) => [5, 10, 20, 50].includes(m))).toBe(true)
  })

  it('KR-09 isMilestone is true exactly at combo 5 and 10', () => {
    useGameStore.getState().startCustomGame('abcdefghijkl', 'easy')
    const hits: number[] = []
    for (const k of 'abcdefghijkl') {
      const r = useGameStore.getState().handleKeypress(k)
      if (r.isMilestone) hits.push(useGameStore.getState().gameState.combo)
    }
    expect(hits).toEqual([5, 10])
    expect(createInitialState('classic', 'easy', 5).combo).toBe(0)
  })
})
