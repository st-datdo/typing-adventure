import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ComboAnnouncerView, scheduleClear } from '../ComboAnnouncer'
import { COMBO_BURST_MS } from '@/lib/kr/combo-celebration'
import { useComboCelebrationStore } from '@/stores/combo-celebration-store'

describe('ComboAnnouncer', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.useRealTimers()
    useComboCelebrationStore.getState().clear()
  })

  it('KR-09 announcer is always mounted as a polite live region', () => {
    const empty = renderToStaticMarkup(<ComboAnnouncerView milestone={null} lang="vi" />)
    expect(empty).toContain('aria-live="polite"')
    expect(empty).toContain('sr-only')
    const full = renderToStaticMarkup(
      <ComboAnnouncerView milestone={{ value: 10, id: 2 }} lang="vi" />,
    )
    expect(full).toContain('Chuỗi 10! Siêu quá!')
  })

  it('KR-09 container clears the milestone after COMBO_BURST_MS', () => {
    const store = useComboCelebrationStore
    store.getState().celebrate(5)
    const m = store.getState().milestone!
    expect(m.value).toBe(5)
    const cancel = scheduleClear(m, store.getState().clear)
    vi.advanceTimersByTime(COMBO_BURST_MS - 1)
    expect(store.getState().milestone).not.toBeNull()
    vi.advanceTimersByTime(1)
    expect(store.getState().milestone).toBeNull()
    cancel()

    store.getState().celebrate(10)
    const n = store.getState().milestone!
    const stop = scheduleClear(n, store.getState().clear)
    stop()
    vi.advanceTimersByTime(COMBO_BURST_MS * 2)
    expect(store.getState().milestone?.value).toBe(10)
  })
})
