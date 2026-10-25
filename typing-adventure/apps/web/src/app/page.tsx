'use client'

import { useState, useEffect } from 'react'
import { GameEngine } from '@/components/game/GameEngine'
import { AgePicker } from '@/components/age/AgePicker'
import { LittleMode } from '@/components/little/LittleMode'
import { useSettingsStore } from '@/stores/settings-store'
import { useProfileSync } from '@/hooks/useProfileSync'
import { useChildProgressSync } from '@/hooks/useChildProgressSync'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

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
    return <LoadingScreen />
  }

  if (ageGroup === null) return <AgePicker />
  if (ageGroup === 'little') return <LittleMode />
  return <GameEngine />
}
