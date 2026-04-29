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

  const cls: Record<string, string> = {
    saved: 'sync--saved',
    syncing: 'sync--syncing',
    offline: 'sync--offline',
  }

  return (
    <div className={`sync-indicator ${cls[status] ?? ''}`}>
      {labels[status]}
    </div>
  )
}
