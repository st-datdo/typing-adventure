'use client'

import { useEffect } from 'react'
import { OWL_SLEEP_MS, OWL_WAVE_MS } from '@/lib/fx/owl'
import { useFxStore } from '@/stores/fx-store'

export function useOwlIdle(active: boolean, keyStamp: number) {
  useEffect(() => {
    if (!active) return
    let timers: ReturnType<typeof setTimeout>[] = []
    const clear = () => {
      timers.forEach(clearTimeout)
      timers = []
    }
    const start = () => {
      clear()
      if (document.visibilityState !== 'visible') return
      const { dispatch } = useFxStore.getState()
      timers.push(setTimeout(() => dispatch({ type: 'idle', mood: 'wave' }), OWL_WAVE_MS))
      timers.push(setTimeout(() => dispatch({ type: 'idle', mood: 'sleep' }), OWL_SLEEP_MS))
    }
    const onVisibility = () => (document.visibilityState === 'visible' ? start() : clear())
    start()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clear()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [active, keyStamp])
}
