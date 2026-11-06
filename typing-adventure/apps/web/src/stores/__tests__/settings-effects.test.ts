import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const updateSettings = vi.fn(async (data: Record<string, unknown>) => ({
  success: true,
  data,
}))

vi.mock('@/lib/api/users', () => ({
  updateSettings: (data: Record<string, unknown>) => updateSettings(data),
  updateProfile: vi.fn(async () => ({ success: true })),
}))

type Mod = typeof import('../settings-store')
let mod: Mod

beforeEach(async () => {
  vi.resetModules()
  vi.useFakeTimers()
  updateSettings.mockClear()
  updateSettings.mockImplementation(async (data) => ({ success: true, data }))
  const mem = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => void mem.set(k, v),
    removeItem: (k: string) => void mem.delete(k),
    clear: () => mem.clear(),
    key: () => null,
    length: 0,
  })
  mod = await import('../settings-store')
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('settings store effectsLevel', () => {
  it('FX-14 default lots', () => {
    expect(mod.useSettingsStore.getState().effectsLevel).toBe('lots')
  })

  it('FX-14 setEffectsLevel syncs after debounce when logged in', () => {
    const s = mod.useSettingsStore.getState()
    s.setIsLoggedIn(true)
    s.setEffectsLevel('some')
    expect(mod.useSettingsStore.getState().effectsLevel).toBe('some')
    expect(updateSettings).not.toHaveBeenCalled()
    vi.advanceTimersByTime(300)
    expect(updateSettings).toHaveBeenCalledWith({ effectsLevel: 'some' })
  })

  it('FX-14 guest does not call the API', () => {
    mod.useSettingsStore.getState().setEffectsLevel('few')
    vi.advanceTimersByTime(1000)
    expect(mod.useSettingsStore.getState().effectsLevel).toBe('few')
    expect(updateSettings).not.toHaveBeenCalled()
  })

  it('FX-14 loadFromServer restores a valid level and ignores junk', () => {
    const s = mod.useSettingsStore.getState()
    s.loadFromServer({ name: 'A', settings: { effectsLevel: 'few' } })
    expect(mod.useSettingsStore.getState().effectsLevel).toBe('few')
    s.loadFromServer({ name: 'A', settings: { effectsLevel: 'max' } })
    expect(mod.useSettingsStore.getState().effectsLevel).toBe('few')
    s.loadFromServer({ name: 'A', settings: {} })
    expect(mod.useSettingsStore.getState().effectsLevel).toBe('few')
  })

  it('FX-14 persist keeps effectsLevel', () => {
    const opts = mod.useSettingsStore.persist.getOptions()
    const saved = opts.partialize!(mod.useSettingsStore.getState()) as Record<string, unknown>
    expect(saved.effectsLevel).toBe('lots')
    expect(opts.version).toBe(1)
  })

  it('FX-14 E13 offline keeps the new level and does not throw', async () => {
    updateSettings.mockImplementation(async () => {
      throw new Error('offline')
    })
    const s = mod.useSettingsStore.getState()
    s.setIsLoggedIn(true)
    s.setEffectsLevel('few')
    expect(() => vi.advanceTimersByTime(300)).not.toThrow()
    await vi.runAllTimersAsync()
    expect(updateSettings).toHaveBeenCalledTimes(1)
    expect(mod.useSettingsStore.getState().effectsLevel).toBe('few')
  })
})
