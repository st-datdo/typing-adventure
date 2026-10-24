'use client'

import { useEffect, useRef } from 'react'

export function useLetterKeys(onLetter: (letter: string) => void, enabled = true): void {
  const handlerRef = useRef(onLetter)
  handlerRef.current = onLetter

  useEffect(() => {
    if (!enabled) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return
      const physical = /^Key[A-Z]$/.test(e.code) ? e.code.slice(3).toLowerCase() : null
      const key = /^[a-zA-Z]$/.test(e.key) ? e.key.toLowerCase() : physical && !/^[ -~]$/.test(e.key) ? physical : null
      if (!key) return
      e.preventDefault()
      handlerRef.current(key)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled])
}
