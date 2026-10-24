'use client'

import { useState, useEffect } from 'react'
import { GameEngine } from '@/components/game/GameEngine'
import { AgePicker } from '@/components/age/AgePicker'
import { LittleMode } from '@/components/little/LittleMode'
import { useSettingsStore } from '@/stores/settings-store'
import { useProfileSync } from '@/hooks/useProfileSync'
import { useChildProgressSync } from '@/hooks/useChildProgressSync'

export default function PlayPage() {
  const [hydrated, setHydrated] = useState(false)
  const profileReady = useProfileSync()
  useChildProgressSync()
  const ageGroup = useSettingsStore(s => s.ageGroup)

  useEffect(() => {
    if (useSettingsStore.persist.hasHydrated()) {
      setHydrated(true)
      return
    }
    return useSettingsStore.persist.onFinishHydration(() => setHydrated(true))
  }, [])

  if (!hydrated || !profileReady) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>🎹</div>
          <div style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem' }}>Loading...</div>
        </div>
      </div>
    )
  }

  if (ageGroup === null) return <AgePicker />
  if (ageGroup === 'little') return <LittleMode />
  return <GameEngine />
}
