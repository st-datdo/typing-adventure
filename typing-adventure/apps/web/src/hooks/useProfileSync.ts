'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { getProfile } from '@/lib/api/users'
import { useSettingsStore } from '@/stores/settings-store'

export function useProfileSync(): boolean {
  const { data: session, status } = useSession()
  const loadedRef = useRef<string | null>(null)
  const [ready, setReady] = useState(false)
  const userId = session?.user?.id ?? null

  useEffect(() => {
    if (status === 'loading') return
    const settings = useSettingsStore.getState()
    if (!userId) {
      loadedRef.current = null
      settings.setIsLoggedIn(false)
      setReady(true)
      return
    }
    settings.setIsLoggedIn(true)
    if (loadedRef.current === userId) {
      setReady(true)
      return
    }
    loadedRef.current = userId
    getProfile()
      .then((res) => {
        if (!res.success || !res.data) return
        useSettingsStore.getState().loadFromServer({
          name: res.data.name,
          avatar: res.data.avatar,
          settings: res.data.settings as Record<string, unknown> | null,
        })
      })
      .catch(() => {})
      .finally(() => setReady(true))
  }, [status, userId])

  return ready
}
