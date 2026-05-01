'use client'

import { useEffect, useState, useCallback } from 'react'
import { apiClient } from '@/lib/api/client'

interface WordPack {
  id: string
  name: string
  description: string | null
  language: string
  level: string
  category: string | null
  isDefault: boolean
  words: string[]
  wordCount: number
  createdAt: string
}

interface FormData {
  name: string
  description: string
  language: string
  level: string
  category: string
  words: string
  isDefault: boolean
}

const EMPTY_FORM: FormData = {
  name: '',
  description: '',
  language: 'en',
  level: 'easy',
  category: '',
  words: '',
  isDefault: false,
}

export default function AdminWordsPage() {
  const [packs, setPacks] = useState<WordPack[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [previewPack, setPreviewPack] = useState<WordPack | null>(null)

  const limit = 20

  const fetchPacks = useCallback(async () => {
    setLoading(true)
    const res = await apiClient<WordPack[]>(`/api/wordpacks?page=${page}&limit=${limit}`)
    if (res.success && res.data) {
      setPacks(res.data)
      setTotal(res.meta?.total ?? 0)
    }
    setLoading(false)
  }, [page])

  useEffect(() => { fetchPacks() }, [fetchPacks])

  const openCreate = () => {
    setEditId(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  const openEdit = (pack: WordPack) => {
    setEditId(pack.id)
    setForm({
      name: pack.name,
      description: pack.description ?? '',
      language: pack.language,
      level: pack.level,
      category: pack.category ?? '',
      words: pack.words.join(', '),
      isDefault: pack.isDefault,
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    setSaving(true)
    const wordsArr = form.words
      .split(/[,\n]+/)
      .map((w) => w.trim().toLowerCase())
      .filter(Boolean)

    const body = {
      name: form.name,
      description: form.description || undefined,
      language: form.language,
      level: form.level,
      category: form.category || undefined,
      words: wordsArr,
      isDefault: form.isDefault,
    }

    if (editId) {
      await apiClient(`/api/wordpacks/${editId}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      })
    } else {
      await apiClient('/api/wordpacks', {
        method: 'POST',
        body: JSON.stringify(body),
      })
    }

    setSaving(false)
    setShowModal(false)
    fetchPacks()
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete word pack "${name}"?`)) return
    await apiClient(`/api/wordpacks/${id}`, { method: 'DELETE' })
    fetchPacks()
  }

  const handleCSVImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv,.txt'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const text = await file.text()
      const words = text
        .split(/[,\n\r]+/)
        .map((w) => w.trim().toLowerCase())
        .filter(Boolean)
      setForm((prev) => ({
        ...prev,
        words: words.join(', '),
      }))
    }
    input.click()
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div>
      <h1 className="admin-page-title">📝 Word Packs</h1>

      <div className="admin-table-wrap">
        <div className="admin-table-header">
          <span className="admin-table-title">
            {total} word packs
          </span>
          <button className="admin-btn admin-btn-primary" onClick={openCreate}>
            + New Pack
          </button>
        </div>

        {loading ? (
          <div className="admin-loading">Loading...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Level</th>
                <th>Category</th>
                <th>Words</th>
                <th>Default</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {packs.map((pack) => (
                <tr key={pack.id}>
                  <td style={{ fontWeight: 600 }}>{pack.name}</td>
                  <td>
                    <span className="admin-badge admin-badge-user">{pack.level}</span>
                  </td>
                  <td>{pack.category ?? '—'}</td>
                  <td>{pack.wordCount}</td>
                  <td>{pack.isDefault ? '✅' : '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="admin-btn admin-btn-sm"
                        onClick={() => setPreviewPack(previewPack?.id === pack.id ? null : pack)}
                      >
                        👁️
                      </button>
                      <button
                        className="admin-btn admin-btn-sm"
                        onClick={() => openEdit(pack)}
                      >
                        ✏️
                      </button>
                      <button
                        className="admin-btn admin-btn-sm admin-btn-danger"
                        onClick={() => handleDelete(pack.id, pack.name)}
                      >
                        🗑️
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

      {/* Preview panel */}
      {previewPack && (
        <div style={{ marginTop: 16 }}>
          <div className="admin-table-wrap" style={{ padding: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>
              Preview: {previewPack.name} ({previewPack.words.length} words)
            </div>
            <div className="word-preview">
              {previewPack.words.map((w, i) => (
                <span key={i} className="word-chip">{w}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="admin-modal-title">
              {editId ? '✏️ Edit Word Pack' : '➕ New Word Pack'}
            </h2>

            <div className="admin-form-group">
              <label className="admin-form-label">Name</label>
              <input
                className="admin-input"
                style={{ width: '100%' }}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Animals"
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Description</label>
              <input
                className="admin-input"
                style={{ width: '100%' }}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-form-label">Level</label>
                <select
                  className="admin-select"
                  style={{ width: '100%' }}
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Language</label>
                <input
                  className="admin-input"
                  style={{ width: '100%' }}
                  value={form.language}
                  onChange={(e) => setForm({ ...form, language: e.target.value })}
                />
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-form-label">Category</label>
                <input
                  className="admin-input"
                  style={{ width: '100%' }}
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="e.g., animals, food"
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Default Pack</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  />
                  <span style={{ fontSize: '0.85rem' }}>Is default</span>
                </label>
              </div>
            </div>

            <div className="admin-form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="admin-form-label">Words (comma or newline separated)</label>
                <button
                  className="admin-btn admin-btn-sm"
                  onClick={handleCSVImport}
                  type="button"
                >
                  📂 Import CSV
                </button>
              </div>
              <textarea
                className="admin-textarea"
                value={form.words}
                onChange={(e) => setForm({ ...form, words: e.target.value })}
                placeholder="cat, dog, fish, bird..."
                rows={5}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', marginTop: 4 }}>
                {form.words.split(/[,\n]+/).map((w) => w.trim()).filter(Boolean).length} words
              </div>
            </div>

            {/* Preview */}
            {form.words && (
              <div className="word-preview" style={{ marginBottom: 16 }}>
                {form.words
                  .split(/[,\n]+/)
                  .map((w) => w.trim().toLowerCase())
                  .filter(Boolean)
                  .slice(0, 30)
                  .map((w, i) => (
                    <span key={i} className="word-chip">{w}</span>
                  ))}
                {form.words.split(/[,\n]+/).filter((w) => w.trim()).length > 30 && (
                  <span className="word-chip" style={{ opacity: 0.6 }}>
                    +{form.words.split(/[,\n]+/).filter((w) => w.trim()).length - 30} more
                  </span>
                )}
              </div>
            )}

            <div className="admin-modal-actions">
              <button className="admin-btn" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button
                className="admin-btn admin-btn-primary"
                onClick={handleSave}
                disabled={saving || !form.name || !form.words}
              >
                {saving ? 'Saving...' : editId ? 'Save Changes' : 'Create Pack'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
