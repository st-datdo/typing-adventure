'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GamesHub } from '@/components/games/GamesHub'
import { useSettingsStore } from '@/stores/settings-store'
import { useProfileSync } from '@/hooks/useProfileSync'
import { useChildProgressSync } from '@/hooks/useChildProgressSync'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

export default function GamesPage() {
  const router = useRouter()
  const [hydrated, setHydrated] = useState(false)
  const profileReady = useProfileSync()
  const ageGroup = useSettingsStore(s => s.ageGroup)
  useChildProgressSync()

  useEffect(() => {
    if (useSettingsStore.persist.hasHydrated()) {
      setHydrated(true)
      return
    }
    return useSettingsStore.persist.onFinishHydration(() => setHydrated(true))
  }, [])

  const blocked = hydrated && profileReady && ageGroup === 'little'

  useEffect(() => {
    if (blocked) router.replace('/')
  }, [blocked, router])

  if (!hydrated || !profileReady || blocked) {
    return <LoadingScreen icon="🎈" />
  }

  return <GamesHub />
}
