'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { mergeChildProgress, normalizeChildProgress, sameChildProgress } from '@typing-adventure/game-engine'
import type { ChildProgress } from '@typing-adventure/game-engine'
import { getChildProgress, saveChildProgress } from '@/lib/api/progress'
import { useLittleStore } from '@/stores/little-store'
import { useGamesStore } from '@/stores/games-store'

const PUSH_DELAY_MS = 1500

function snapshot(): ChildProgress {
  const little = useLittleStore.getState()
  const games = useGamesStore.getState()
  return {
    little: {
      progress: little.progress,
      stickers: little.stickers,
      daily: little.daily,
      dailyLimit: little.dailyLimit,
      pet: little.pet,
    },
    games: { best: games.best, plays: games.plays },
    updatedAt: Math.max(little.updatedAt, games.updatedAt),
  }
}

function apply(data: ChildProgress): void {
  useLittleStore.getState().applySaved(data.little, data.updatedAt)
  useGamesStore.getState().applySaved(data.games, data.updatedAt)
}

function whenHydrated(): Promise<void> {
  const stores = [useLittleStore.persist, useGamesStore.persist]
  return Promise.all(stores.map(p => (p.hasHydrated()
    ? Promise.resolve()
    : new Promise<void>(resolve => {
      const unsub = p.onFinishHydration(() => {
        unsub()
        resolve()
      })
    })))).then(() => undefined)
}

export function useChildProgressSync(): void {
  const { data: session, status } = useSession()
  const userId = status === 'authenticated' ? session?.user?.id ?? null : null

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let lastSynced: ChildProgress | null = null
    let pushing = false
    let pushAgain = false

    const push = async () => {
      if (cancelled) return
      if (pushing) {
        pushAgain = true
        return
      }
      pushing = true
      const local = snapshot()
      const replace = useLittleStore.getState().needsReplace
      const res = await saveChildProgress(local, replace)
      pushing = false
      if (cancelled) return
      if (res.success && res.data) {
        if (replace) useLittleStore.getState().clearNeedsReplace()
        const server = normalizeChildProgress(res.data)
        const current = snapshot()
        const merged = mergeChildProgress(current, server)
        lastSynced = merged
        if (!sameChildProgress(current, merged)) apply(merged)
      }
      if (pushAgain) {
        pushAgain = false
        schedule()
      }
    }

    const schedule = () => {
      clearTimeout(timer)
      timer = setTimeout(() => { void push() }, PUSH_DELAY_MS)
    }

    const onChange = () => {
      if (lastSynced === null) return
      if (sameChildProgress(snapshot(), lastSynced) && !useLittleStore.getState().needsReplace) return
      schedule()
    }

    const start = async () => {
      await whenHydrated()
      if (cancelled) return
      const res = await getChildProgress()
      if (cancelled || !res.success || !res.data) return
      const server = normalizeChildProgress(res.data)
      const little = useLittleStore.getState()
      const otherChild = little.owner !== null && little.owner !== userId
      little.setOwner(userId)
      if (otherChild) {
        useLittleStore.getState().clearNeedsReplace()
        apply(server)
        lastSynced = server
        return
      }
      if (little.needsReplace) {
        lastSynced = server
        void push()
        return
      }
      const local = snapshot()
      const merged = mergeChildProgress(local, server)
      if (!sameChildProgress(local, merged)) apply(merged)
      lastSynced = server
      if (!sameChildProgress(merged, server)) void push()
      else lastSynced = merged
    }

    const unsubLittle = useLittleStore.subscribe(onChange)
    const unsubGames = useGamesStore.subscribe(onChange)
    void start()

    return () => {
      cancelled = true
      clearTimeout(timer)
      unsubLittle()
      unsubGames()
    }
  }, [userId])
}
