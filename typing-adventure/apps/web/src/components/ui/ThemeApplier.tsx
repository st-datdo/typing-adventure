'use client'

import { useEffect } from 'react'
import { useSettingsStore } from '@/stores/settings-store'

export function ThemeApplier() {
  const theme = useSettingsStore(s => s.theme)
  const lang = useSettingsStore(s => s.lang)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang)
  }, [lang])

  return null
}
