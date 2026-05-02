'use client'

import { useState } from 'react'
import { useSettingsStore } from '@/stores/settings-store'
import { t } from '@typing-adventure/i18n'

interface CustomTextModalProps {
  onStart: (text: string) => void
  onClose: () => void
}

export function CustomTextModal({ onStart, onClose }: CustomTextModalProps) {
  const [text, setText] = useState('')
  const { lang } = useSettingsStore()
  const trimmed = text.trim()
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0

  const handleStart = () => {
    if (trimmed.length < 2) return
    onStart(trimmed)
  }

  return (
    <div className="settings-overlay settings--visible" onClick={onClose}>
      <div
        className="settings-panel custom-text-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="settings-title">
          {lang === 'vi' ? 'Nhập văn bản tùy chỉnh' : 'Custom Text'}
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-dim)', marginBottom: 12 }}>
          {lang === 'vi'
            ? 'Nhập đoạn văn bản bạn muốn luyện gõ:'
            : 'Type any text you want to practice:'}
        </p>
        <textarea
          className="custom-text-input"
          placeholder={
            lang === 'vi'
              ? 'Ví dụ: Con mèo ngồi trên mái nhà...'
              : 'e.g. The quick brown fox jumps over the lazy dog...'
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
        />
        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)', marginTop: 6 }}>
          {wordCount} {lang === 'vi' ? 'từ' : 'words'} / {trimmed.length}{' '}
          {lang === 'vi' ? 'ký tự' : 'chars'}
        </div>
        <div className="custom-text-actions">
          <button className="btn" onClick={onClose}>
            {lang === 'vi' ? 'Hủy' : 'Cancel'}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleStart}
            disabled={trimmed.length < 2}
          >
            {lang === 'vi' ? 'Bắt đầu luyện' : 'Start Typing'}
          </button>
        </div>
      </div>
    </div>
  )
}
