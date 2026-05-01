'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { apiClient } from '@/lib/api/client'

interface AdminUser {
  id: string
  email: string
  name: string | null
  avatar: string
  role: 'USER' | 'ADMIN'
  createdAt: string
  records: {
    bestWpm: Record<string, number>
    totalGames: number
  } | null
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const limit = 20

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (search) params.set('search', search)
    const res = await apiClient<AdminUser[]>(`/api/admin/users?${params}`)
    if (res.success && res.data) {
      setUsers(res.data)
      setTotal(res.meta?.total ?? 0)
    }
    setLoading(false)
  }, [page, search])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN'
    if (!confirm(`Change role to ${newRole}?`)) return
    await apiClient(`/api/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ role: newRole }),
    })
    fetchUsers()
  }

  const getBestWpm = (records: AdminUser['records']): number => {
    if (!records?.bestWpm) return 0
    const wpm = records.bestWpm
    return Math.max(wpm.easy ?? 0, wpm.medium ?? 0, wpm.hard ?? 0)
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div>
      <h1 className="admin-page-title">👥 Users</h1>

      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <input
          className="admin-input"
          style={{ flex: 1 }}
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setPage(1)
              fetchUsers()
            }
          }}
        />
        <button
          className="admin-btn admin-btn-primary"
          onClick={() => { setPage(1); fetchUsers() }}
        >
          Search
        </button>
      </div>

      <div className="admin-table-wrap">
        <div className="admin-table-header">
          <span className="admin-table-title">{total} users</span>
        </div>

        {loading ? (
          <div className="admin-loading">Loading...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Best WPM</th>
                <th>Games</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <span style={{ marginRight: 6 }}>{user.avatar}</span>
                    <span style={{ fontWeight: 600 }}>{user.name ?? '—'}</span>
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--color-text-dim)' }}>
                    {user.email}
                  </td>
                  <td>
                    <span className={`admin-badge ${user.role === 'ADMIN' ? 'admin-badge-admin' : 'admin-badge-user'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{getBestWpm(user.records)}</td>
                  <td>{user.records?.totalGames ?? 0}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Link
                        href={`/profile/${user.id}`}
                        className="admin-btn admin-btn-sm"
                      >
                        👁️
                      </Link>
                      <button
                        className={`admin-btn admin-btn-sm ${user.role === 'ADMIN' ? 'admin-btn-danger' : ''}`}
                        onClick={() => toggleRole(user.id, user.role)}
                      >
                        {user.role === 'ADMIN' ? '⬇️ Demote' : '⬆️ Promote'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div className="admin-pagination">
            <button
              className="admin-btn admin-btn-sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              ← Prev
            </button>
            <span>Page {page}/{totalPages}</span>
            <button
              className="admin-btn admin-btn-sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
