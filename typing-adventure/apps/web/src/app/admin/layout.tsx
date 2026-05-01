'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api/client'

const NAV_ITEMS = [
  { href: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/admin/words', icon: '📝', label: 'Word Packs' },
  { href: '/admin/users', icon: '👥', label: 'Users' },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [authorized, setAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user) {
      setAuthorized(false)
      return
    }
    // Verify admin role via stats endpoint (lightweight check)
    apiClient('/api/admin/stats').then((res) => {
      setAuthorized(res.success)
    }).catch(() => {
      setAuthorized(false)
    })
  }, [session, status])

  if (status === 'loading' || authorized === null) {
    return <div className="admin-loading">Loading...</div>
  }

  if (!authorized) {
    return (
      <div className="admin-loading">
        <p style={{ fontSize: '2rem', marginBottom: 12 }}>🔒</p>
        <p>Access denied. Admin only.</p>
        <Link href="/" style={{ color: 'var(--color-accent)', marginTop: 12, display: 'inline-block' }}>
          ← Back to home
        </Link>
      </div>
    )
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <span>🎹</span>
          <span>Admin Panel</span>
        </div>
        <nav className="admin-sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-link ${pathname === item.href ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <Link href="/" className="admin-back-link">
            ← <span>Back to game</span>
          </Link>
        </div>
      </aside>
      <main className="admin-main">
        {children}
      </main>
    </div>
  )
}
