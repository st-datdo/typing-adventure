'use client'

import { useEffect, useState, use } from 'react'
import { apiClient } from '@/lib/api/client'

interface StudentInfo {
  userId: string
  name: string | null
  email: string
  avatar: string
  joinedAt: string
  totalGames: number
  bestWpm: Record<string, number>
  lastPlayDate: string | null
  recentSessions: { wpm: number; accuracy: number; date: string }[]
}

interface AssignmentInfo {
  id: string
  title: string
  gameMode: string
  level: string
  deadline: string | null
  createdAt: string
}

interface ClassroomDetail {
  id: string
  name: string
  description: string | null
  inviteCode: string
  students: StudentInfo[]
  assignments: AssignmentInfo[]
  classStats: {
    avgWpm: number
    avgAccuracy: number
    topMistakes: { char: string; count: number }[]
  }
}

type Tab = 'students' | 'assignments' | 'stats'

function MiniWpmChart({ sessions }: { sessions: { wpm: number }[] }) {
  if (sessions.length === 0) return <span className="text-dim">—</span>
  const maxWpm = Math.max(...sessions.map((s) => s.wpm), 1)
  return (
    <div className="progress-mini-chart">
      {sessions
        .slice()
        .reverse()
        .slice(-10)
        .map((s, i) => (
          <div
            key={i}
            className="progress-mini-bar"
            style={{ height: `${(s.wpm / maxWpm) * 100}%` }}
            title={`${s.wpm} WPM`}
          />
        ))}
    </div>
  )
}

export default function ClassroomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [data, setData] = useState<ClassroomDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('students')
  const [addEmail, setAddEmail] = useState('')
  const [addError, setAddError] = useState('')
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [assignForm, setAssignForm] = useState({
    title: '',
    gameMode: 'words',
    level: 'easy',
    deadline: '',
  })

  const fetchData = () => {
    apiClient<ClassroomDetail>(`/api/admin/classrooms/${id}`).then((res) => {
      if (res.success && res.data) setData(res.data)
      setLoading(false)
    })
  }

  useEffect(() => {
    fetchData()
  }, [id])

  const addStudent = async () => {
    if (!addEmail.trim()) return
    setAddError('')
    const res = await apiClient(`/api/admin/classrooms/${id}/members`, {
      method: 'POST',
      body: JSON.stringify({ email: addEmail }),
    })
    if (res.success) {
      setAddEmail('')
      fetchData()
    } else {
      setAddError(res.error ?? 'Failed to add student')
    }
  }

  const removeStudent = async (userId: string) => {
    await apiClient(`/api/admin/classrooms/${id}/members?userId=${userId}`, {
      method: 'DELETE',
    })
    fetchData()
  }

  const createAssignment = async () => {
    if (!assignForm.title.trim()) return
    const res = await apiClient(`/api/admin/classrooms/${id}/assignments`, {
      method: 'POST',
      body: JSON.stringify({
        ...assignForm,
        deadline: assignForm.deadline || undefined,
      }),
    })
    if (res.success) {
      setAssignForm({ title: '', gameMode: 'words', level: 'easy', deadline: '' })
      setShowAssignForm(false)
      fetchData()
    }
  }

  const exportCsv = () => {
    window.open(`/api/admin/classrooms/${id}/export`, '_blank')
  }

  if (loading) return <div className="admin-loading">Loading classroom...</div>
  if (!data) return <div className="admin-loading">Classroom not found.</div>

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1 className="admin-page-title">{data.name}</h1>
          {data.description && (
            <p className="text-dim" style={{ fontSize: '0.85rem', marginTop: -16 }}>
              {data.description}
            </p>
          )}
        </div>
        <button className="admin-btn" onClick={exportCsv}>
          📥 Export CSV
        </button>
      </div>

      {/* Invite Section */}
      <div className="invite-section">
        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Invite Link:</span>
        <div className="invite-link-box">
          {typeof window !== 'undefined'
            ? `${window.location.origin}/join/${data.inviteCode}`
            : `/join/${data.inviteCode}`}
        </div>
        <button
          className="admin-btn admin-btn-sm"
          onClick={() => {
            navigator.clipboard.writeText(
              `${window.location.origin}/join/${data.inviteCode}`,
            )
          }}
        >
          Copy
        </button>
      </div>

      {/* Class Stats */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-card-icon">👨‍🎓</div>
          <div className="stat-card-value">{data.students.length}</div>
          <div className="stat-card-label">Students</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">⚡</div>
          <div className="stat-card-value">{data.classStats.avgWpm}</div>
          <div className="stat-card-label">Avg WPM</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">🎯</div>
          <div className="stat-card-value">{data.classStats.avgAccuracy}%</div>
          <div className="stat-card-label">Avg Accuracy</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">📝</div>
          <div className="stat-card-value">{data.assignments.length}</div>
          <div className="stat-card-label">Assignments</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        {(['students', 'assignments', 'stats'] as Tab[]).map((t) => (
          <button
            key={t}
            className={`admin-tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'students' && '👨‍🎓 Students'}
            {t === 'assignments' && '📝 Assignments'}
            {t === 'stats' && '📊 Statistics'}
          </button>
        ))}
      </div>

      {/* Students Tab */}
      {tab === 'students' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input
              className="admin-input"
              placeholder="Add student by email..."
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addStudent()}
              style={{ flex: 1 }}
            />
            <button className="admin-btn admin-btn-primary" onClick={addStudent}>
              Add
            </button>
          </div>
          {addError && (
            <div
              style={{
                color: 'var(--color-wrong)',
                fontSize: '0.82rem',
                marginBottom: 12,
              }}
            >
              {addError}
            </div>
          )}

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Total Games</th>
                  <th>Best WPM</th>
                  <th>WPM Trend</th>
                  <th>Last Active</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.students.map((s) => (
                  <tr key={s.userId}>
                    <td>
                      <div className="student-row">
                        <span className="student-avatar">{s.avatar}</span>
                        <div className="student-info">
                          <span className="student-name">
                            {s.name ?? 'Unknown'}
                          </span>
                          <span className="student-email">{s.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>{s.totalGames}</td>
                    <td>
                      {Math.max(
                        s.bestWpm.easy ?? 0,
                        s.bestWpm.medium ?? 0,
                        s.bestWpm.hard ?? 0,
                      )}
                    </td>
                    <td>
                      <MiniWpmChart sessions={s.recentSessions} />
                    </td>
                    <td className="text-dim">
                      {s.lastPlayDate
                        ? new Date(s.lastPlayDate).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td>
                      <button
                        className="admin-btn admin-btn-danger admin-btn-sm"
                        onClick={() => removeStudent(s.userId)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {data.students.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty-state">
                      No students yet. Add by email above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assignments Tab */}
      {tab === 'assignments' && (
        <div>
          <button
            className="admin-btn admin-btn-primary"
            style={{ marginBottom: 16 }}
            onClick={() => setShowAssignForm(!showAssignForm)}
          >
            {showAssignForm ? 'Cancel' : '+ New Assignment'}
          </button>

          {showAssignForm && (
            <div
              className="chart-card"
              style={{ marginBottom: 20, padding: 20 }}
            >
              <div className="admin-form-group">
                <label className="admin-form-label">Title</label>
                <input
                  className="admin-input"
                  style={{ width: '100%' }}
                  placeholder="e.g., Practice Home Row Keys"
                  value={assignForm.title}
                  onChange={(e) =>
                    setAssignForm({ ...assignForm, title: e.target.value })
                  }
                />
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Game Mode</label>
                  <select
                    className="admin-select"
                    style={{ width: '100%' }}
                    value={assignForm.gameMode}
                    onChange={(e) =>
                      setAssignForm({ ...assignForm, gameMode: e.target.value })
                    }
                  >
                    <option value="words">Words</option>
                    <option value="sentences">Sentences</option>
                    <option value="lesson">Lesson</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Level</label>
                  <select
                    className="admin-select"
                    style={{ width: '100%' }}
                    value={assignForm.level}
                    onChange={(e) =>
                      setAssignForm({ ...assignForm, level: e.target.value })
                    }
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Deadline (optional)</label>
                  <input
                    type="date"
                    className="admin-input"
                    style={{ width: '100%' }}
                    value={assignForm.deadline}
                    onChange={(e) =>
                      setAssignForm({ ...assignForm, deadline: e.target.value })
                    }
                  />
                </div>
              </div>
              <button
                className="admin-btn admin-btn-primary"
                onClick={createAssignment}
                disabled={!assignForm.title.trim()}
              >
                Create Assignment
              </button>
            </div>
          )}

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Game Mode</th>
                  <th>Level</th>
                  <th>Deadline</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {data.assignments.map((a) => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600 }}>{a.title}</td>
                    <td>{a.gameMode}</td>
                    <td>
                      <span className="admin-badge admin-badge-user">
                        {a.level}
                      </span>
                    </td>
                    <td>
                      {a.deadline
                        ? new Date(a.deadline).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="text-dim">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {data.assignments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty-state">
                      No assignments yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stats Tab */}
      {tab === 'stats' && (
        <div>
          <div className="charts-row">
            <div className="chart-card">
              <div className="chart-card-title">WPM Distribution</div>
              {data.students.length > 0 ? (
                <div className="top-packs-list">
                  {data.students
                    .slice()
                    .sort((a, b) => {
                      const aMax = Math.max(
                        a.bestWpm.easy ?? 0,
                        a.bestWpm.medium ?? 0,
                        a.bestWpm.hard ?? 0,
                      )
                      const bMax = Math.max(
                        b.bestWpm.easy ?? 0,
                        b.bestWpm.medium ?? 0,
                        b.bestWpm.hard ?? 0,
                      )
                      return bMax - aMax
                    })
                    .map((s, i) => {
                      const bestWpm = Math.max(
                        s.bestWpm.easy ?? 0,
                        s.bestWpm.medium ?? 0,
                        s.bestWpm.hard ?? 0,
                      )
                      const maxClassWpm = Math.max(
                        ...data.students.map((st) =>
                          Math.max(
                            st.bestWpm.easy ?? 0,
                            st.bestWpm.medium ?? 0,
                            st.bestWpm.hard ?? 0,
                          ),
                        ),
                        1,
                      )
                      return (
                        <div key={s.userId} className="top-pack-row">
                          <span className="top-pack-rank">#{i + 1}</span>
                          <span className="top-pack-name">
                            {s.avatar} {s.name ?? s.email.split('@')[0]}
                          </span>
                          <div className="top-pack-bar-bg">
                            <div
                              className="top-pack-bar-fill"
                              style={{
                                width: `${(bestWpm / maxClassWpm) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="top-pack-count">{bestWpm} WPM</span>
                        </div>
                      )
                    })}
                </div>
              ) : (
                <div className="empty-state">No students yet</div>
              )}
            </div>

            <div className="chart-card">
              <div className="chart-card-title">Most Common Mistakes</div>
              {data.classStats.topMistakes.length > 0 ? (
                <div className="top-packs-list">
                  {data.classStats.topMistakes.map((m, i) => {
                    const maxCount = data.classStats.topMistakes[0]?.count ?? 1
                    return (
                      <div key={m.char} className="top-pack-row">
                        <span className="top-pack-rank">#{i + 1}</span>
                        <span
                          className="top-pack-name"
                          style={{ fontFamily: 'monospace', fontSize: '1rem' }}
                        >
                          {m.char === ' ' ? '␣' : m.char}
                        </span>
                        <div className="top-pack-bar-bg">
                          <div
                            className="top-pack-bar-fill"
                            style={{
                              width: `${(m.count / maxCount) * 100}%`,
                              background: 'var(--color-wrong)',
                            }}
                          />
                        </div>
                        <span className="top-pack-count">{m.count}x</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="empty-state">No mistake data yet</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
