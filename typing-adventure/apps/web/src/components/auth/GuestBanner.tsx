'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

export function GuestBanner() {
  const { data: session } = useSession()
  const [dismissed, setDismissed] = useState(false)

  if (session || dismissed) return null

  return (
    <div className="guest-banner">
      <span>💡 Đăng nhập để lưu tiến bộ của bạn!</span>
      <a href="/login">Đăng nhập</a>
      <button className="guest-banner-close" onClick={() => setDismissed(true)}>
        ✕
      </button>
    </div>
  )
}
