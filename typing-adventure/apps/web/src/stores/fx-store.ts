'use client'

import { create } from 'zustand'
import {
  FX_SLOTS,
  INITIAL_FX,
  fxStep,
  slotTtl,
  type FxEvent,
  type FxSlot,
  type FxState,
} from '@/lib/fx/director'
import { mulberry32, type Rng } from '@/lib/fx/rng'

interface FxStore extends FxState {
  dispatch: (event: FxEvent) => void
  reset: () => void
}

let rng: Rng = mulberry32(Date.now())

export function __setRng(next: Rng) {
  rng = next
}

const timers = new Map<FxSlot, ReturnType<typeof setTimeout>>()

function slotId(state: FxState, slot: FxSlot): number | null {
  const v = state[slot] as { id: number } | null
  return v ? v.id : null
}

function clearTimers() {
  for (const t of timers.values()) clearTimeout(t)
  timers.clear()
}

export const useFxStore = create<FxStore>()((set, get) => {
  const dispatch = (event: FxEvent) => {
    const prev = get()
    const next = fxStep(prev, event, rng)
    if (next === prev) return
    set(next)
    for (const slot of FX_SLOTS) {
      const id = slotId(next, slot)
      if (id === slotId(prev, slot)) continue
      const old = timers.get(slot)
      if (old) {
        clearTimeout(old)
        timers.delete(slot)
      }
      if (id === null) continue
      const ttl = slotTtl(next, slot)
      if (ttl === null) continue
      timers.set(
        slot,
        setTimeout(() => {
          timers.delete(slot)
          dispatch({ type: 'expire', slot, id })
        }, ttl),
      )
    }
  }
  return {
    ...INITIAL_FX,
    dispatch,
    reset: () => {
      clearTimers()
      dispatch({ type: 'reset' })
    },
  }
})
