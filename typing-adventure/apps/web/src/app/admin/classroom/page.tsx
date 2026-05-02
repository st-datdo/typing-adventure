'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api/client'

interface ClassroomSummary {
  id: string
  name: string
  description: string | null
  inviteCode: string
  studentCount: number
  assignmentCount: number
  createdAt: string
}

export default function ClassroomListPage() {
  const router = useRouter()
  const [classrooms, setClassrooms] = useState<ClassroomSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [creating, setCreating] = useState(false)

  const fetchClassrooms = () => {
    apiClient<ClassroomSummary[]>('/api/admin/classrooms').then((res) => {
      if (res.success && res.data) setClassrooms(res.data)
      setLoading(false)
    })
  }

  useEffect(() => {
    fetchClassrooms()
  }, [])

  const handleCreate = async () => {
    if (!formName.trim()) return
    setCreating(true)
    const res = await apiClient('/api/admin/classrooms', {
      method: 'POST',
      body: JSON.stringify({ name: formName, description: formDesc || undefined }),
    })
    if (res.success) {
      setFormName('')
      setFormDesc('')
      setShowCreate(false)
      fetchClassrooms()
    }
    setCreating(false)
  }

  if (loading) return <div className="admin-loading">Loading classrooms...</div>

  return (
    <div>
      <div className="dashboard-header">
        <h1 className="admin-page-title">🏫 Classroom</h1>
        <button
          className="admin-btn admin-btn-primary"
          onClick={() => setShowCreate(true)}
        >
          + New Classroom
        </button>
      </div>

      {classrooms.length === 0 && !showCreate && (
        <div className="empty-state">
          No classrooms yet. Create one to get started!
        </div>
      )}

      <div className="classroom-grid">
        {classrooms.map((c) => (
          <div
            key={c.id}
            className="classroom-card"
            onClick={() => router.push(`/admin/classroom/${c.id}`)}
          >
            <div className="classroom-card-header">
              <div className="classroom-card-name">{c.name}</div>
              <div className="classroom-card-count">
                {c.studentCount} students
              </div>
            </div>
            {c.description && (
              <div className="classroom-card-desc">{c.description}</div>
            )}
            <div className="classroom-card-meta">
              <span>{c.assignmentCount} assignments</span>
              <span>
                Code: <strong>{c.inviteCode.slice(0, 8)}</strong>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="admin-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-title">Create Classroom</div>
            <div className="admin-form-group">
              <label className="admin-form-label">Name</label>
              <input
                className="admin-input"
                style={{ width: '100%' }}
                placeholder="e.g., Typing Class 10A"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Description (optional)</label>
              <textarea
                className="admin-textarea"
                placeholder="Brief description of this classroom..."
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
              />
            </div>
            <div className="admin-modal-actions">
              <button
                className="admin-btn"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </button>
              <button
                className="admin-btn admin-btn-primary"
                onClick={handleCreate}
                disabled={creating || !formName.trim()}
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
