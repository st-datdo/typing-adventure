'use client'

import { useSession } from 'next-auth/react'

interface SyncIndicatorProps {
  status: 'idle' | 'syncing' | 'saved' | 'offline'
}

export function SyncIndicator({ status }: SyncIndicatorProps) {
  const { data: session } = useSession()

  if (!session || status === 'idle') return null

  const labels: Record<string, string> = {
    saved: 'Đã lưu ☁️',
    syncing: 'Đang đồng bộ...',
    offline: 'Offline 📴',
  }

  return (
    <div className={`sync-indicator sync--${status}`} role="status">
      {labels[status]}
    </div>
  )
}
