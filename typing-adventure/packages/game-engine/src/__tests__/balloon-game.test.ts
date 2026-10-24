import { describe, it, expect } from 'vitest'
import {
  BALLOON_SPAWN_MS,
  balloonCapacity,
  balloonStars,
  createBalloonGame,
  popBalloon,
  tickBalloons,
} from '../balloon-game'
import type { BalloonGameState } from '../balloon-game'

const fixed = (v: number) => () => v

function withBalloons(state: BalloonGameState, list: { letter: string; y: number }[]): BalloonGameState {
  return {
    ...state,
    balloons: list.map((b, i) => ({ id: i + 1, letter: b.letter, x: 0.5, y: b.y, speed: 0.1, color: 0 })),
    nextId: list.length + 1,
  }
}

describe('tickBalloons', () => {
  it('spawns a balloon right away then waits for the interval', () => {
    let s = createBalloonGame(['a', 'b'])
    s = tickBalloons(s, 16, fixed(0))
    expect(s.balloons).toHaveLength(1)
    expect(s.balloons[0].letter).toBe('a')
    s = tickBalloons(s, 16, fixed(0))
    expect(s.balloons).toHaveLength(1)
    s = tickBalloons(s, BALLOON_SPAWN_MS, fixed(0))
    expect(s.balloons).toHaveLength(2)
    expect(s.balloons[1].letter).toBe('b')
  })

  it('moves balloons up and lets them escape without ending the game', () => {
    let s = withBalloons(createBalloonGame(['a']), [{ letter: 'a', y: 0.95 }])
    s = { ...s, spawnInMs: 10_000 }
    s = tickBalloons(s, 1000, fixed(0))
    expect(s.balloons).toHaveLength(0)
    expect(s.escaped).toBe(1)
    expect(s.finished).toBe(false)
  })

  it('respects the on-screen capacity', () => {
    let s = createBalloonGame()
    for (let i = 0; i < 20; i++) s = tickBalloons(s, BALLOON_SPAWN_MS, fixed(0.01))
    expect(s.balloons.length).toBeLessThanOrEqual(balloonCapacity(0))
  })

  it('does nothing once finished', () => {
    const s = { ...createBalloonGame(), finished: true }
    expect(tickBalloons(s, 100, fixed(0))).toBe(s)
  })
})

describe('popBalloon', () => {
  it('pops the highest balloon with the typed letter, case-insensitive', () => {
    const s = withBalloons(createBalloonGame(), [
      { letter: 'a', y: 0.2 },
      { letter: 'a', y: 0.7 },
      { letter: 'b', y: 0.9 },
    ])
    const r = popBalloon(s, 'A')
    expect(r.popped?.y).toBe(0.7)
    expect(r.state.balloons.map(b => b.y)).toEqual([0.2, 0.9])
    expect(r.state.popped).toBe(1)
  })

  it('ignores letters not on screen and non-letters', () => {
    const s = withBalloons(createBalloonGame(), [{ letter: 'a', y: 0.2 }])
    expect(popBalloon(s, 'z').popped).toBeNull()
    expect(popBalloon(s, '1').state).toBe(s)
  })

  it('finishes after reaching the target', () => {
    const s = withBalloons({ ...createBalloonGame(['a'], 2), popped: 1 }, [{ letter: 'a', y: 0.2 }])
    const r = popBalloon(s, 'a')
    expect(r.state.finished).toBe(true)
  })
})

describe('balloon helpers', () => {
  it('capacity grows with pops but is capped', () => {
    expect(balloonCapacity(0)).toBe(3)
    expect(balloonCapacity(6)).toBe(4)
    expect(balloonCapacity(100)).toBe(5)
  })

  it('stars depend on escaped balloons', () => {
    expect(balloonStars(0)).toBe(3)
    expect(balloonStars(5)).toBe(2)
    expect(balloonStars(10)).toBe(1)
  })
})
