import { describe, expect, it } from 'vitest'
import { shouldCaptureSpace } from '../game-input'

const base = {
  key: ' ',
  panelOpen: false,
  navOpen: false,
  isFinished: false,
  targetInSideNav: false,
}

describe('shouldCaptureSpace', () => {
  it('KR-11 ignores Space while the SideNav is open', () => {
    expect(shouldCaptureSpace({ ...base, navOpen: true })).toBe(false)
  })

  it('KR-11 ignores Space when the target is inside the SideNav', () => {
    expect(shouldCaptureSpace({ ...base, targetInSideNav: true })).toBe(false)
  })

  it('KR-18 ignores Space when a panel is open', () => {
    expect(shouldCaptureSpace({ ...base, panelOpen: true })).toBe(false)
  })

  it('KR-21 ignores Space after the game is finished', () => {
    expect(shouldCaptureSpace({ ...base, isFinished: true })).toBe(false)
  })

  it('KR-21 ignores keys other than Space', () => {
    expect(shouldCaptureSpace({ ...base, key: 'a' })).toBe(false)
    expect(shouldCaptureSpace({ ...base, key: 'Enter' })).toBe(false)
  })

  it('KR-21 captures Space in normal play, including focus on TopBar buttons', () => {
    expect(shouldCaptureSpace(base)).toBe(true)
  })
})
