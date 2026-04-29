'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

const RECORDS_KEY = 'typingAdventure_records'

export function MigrateDialog() {
  const { data: session } = useSession()
  const [show, setShow] = useState(false)
  const [migrating, setMigrating] = useState(false)

  useEffect(() => {
    if (!session) return
    // Check if there's localStorage data to migrate
    const raw = localStorage.getItem(RECORDS_KEY)
    if (!raw) return
    try {
      const data = JSON.parse(raw)
      if (data.state?.records?.totalGames > 0) {
        setShow(true)
      }
    } catch {
      // Invalid data, ignore
    }
  }, [session])

  if (!show) return null

  const handleMigrate = async () => {
    setMigrating(true)
    try {
      const raw = localStorage.getItem(RECORDS_KEY)
      if (!raw) return

      const data = JSON.parse(raw)
      const state = data.state ?? {}

      const res = await fetch('/api/auth/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records: state.records ?? {},
          history: state.history ?? [],
          achievements: state.unlockedAchievements ?? [],
        }),
      })

      const result = await res.json()
      if (result.success) {
        localStorage.removeItem(RECORDS_KEY)
        localStorage.removeItem('typingAdventure_settings')
        setShow(false)
      }
    } catch {
      // Migration failed, user can try again later
    }
    setMigrating(false)
  }

  return (
    <div className="celebration celebration--visible">
      <div className="celebration-content" style={{ maxWidth: 380 }}>
        <div className="celebration-emoji">📦</div>
        <h2 style={{ fontSize: '1.3rem' }}>Nhập dữ liệu cũ?</h2>
        <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem' }}>
          Bạn có dữ liệu chơi trước đó trên thiết bị này. Nhập vào tài khoản?
        </p>
        <div className="celebration-actions">
          <button className="btn btn-restart" onClick={handleMigrate} disabled={migrating}>
            {migrating ? '⏳ Đang nhập...' : '✅ Đồng ý'}
          </button>
          <button className="btn" onClick={() => setShow(false)}>
            Để sau
          </button>
        </div>
      </div>
    </div>
  )
}
