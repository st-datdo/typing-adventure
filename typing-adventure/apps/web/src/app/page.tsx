'use client'

import { useState, useEffect } from 'react'
import { GameEngine } from '@/components/game/GameEngine'

export default function PlayPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>🎹</div>
          <div style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem' }}>Loading...</div>
        </div>
      </div>
    )
  }

  return <GameEngine />
}
