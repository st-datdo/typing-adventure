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
    <div className="ui-overlay" onClick={onClose}>
      <div
        className="ui-modal ta-modal ta-modal--sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="custom-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ta-modal-head">
          <h2 id="custom-title" className="ta-modal-title">
            ✏️ {lang === 'vi' ? 'Nhập văn bản tùy chỉnh' : 'Custom Text'}
          </h2>
          <button type="button" className="ui-chip" aria-label={t(lang, 'navClose')} title={t(lang, 'navClose')} onClick={onClose}>✕</button>
        </div>
        <div className="ta-modal-body">
          <label className="ui-label" htmlFor="custom-text">
            {lang === 'vi'
              ? 'Nhập đoạn văn bản bạn muốn luyện gõ:'
              : 'Type any text you want to practice:'}
          </label>
          <textarea
            id="custom-text"
            className="ui-input ta-textarea"
            placeholder={
              lang === 'vi'
                ? 'Ví dụ: Con mèo ngồi trên mái nhà...'
                : 'e.g. The quick brown fox jumps over the lazy dog...'
            }
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
          />
          <div className="ta-hint">
            {wordCount} {lang === 'vi' ? 'từ' : 'words'} / {trimmed.length}{' '}
            {lang === 'vi' ? 'ký tự' : 'chars'}
          </div>
          <div className="ta-modal-actions">
            <button type="button" className="ui-btn" onClick={onClose}>
              {lang === 'vi' ? 'Hủy' : 'Cancel'}
            </button>
            <button
              type="button"
              className="ui-btn ui-btn--go"
              onClick={handleStart}
              disabled={trimmed.length < 2}
            >
              {lang === 'vi' ? 'Bắt đầu luyện' : 'Start Typing'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
