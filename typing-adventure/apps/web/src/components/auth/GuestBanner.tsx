'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useSettingsStore } from '@/stores/settings-store'
import { t } from '@typing-adventure/i18n'

export function GuestBanner() {
  const { data: session } = useSession()
  const lang = useSettingsStore(s => s.lang)
  const [dismissed, setDismissed] = useState(false)

  if (session || dismissed) return null

  return (
    <aside className="guest-banner guest-banner--inline">
      <span>💡 {t(lang, 'guestSave')}</span>
      <Link href="/login">{t(lang, 'guestLogin')}</Link>
      <button
        type="button"
        className="guest-banner-close"
        aria-label={t(lang, 'navClose')}
        title={t(lang, 'navClose')}
        onClick={() => setDismissed(true)}
      >
        ✕
      </button>
    </aside>
  )
}
