'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { t } from '@typing-adventure/i18n'
import { TopBar } from '@/components/ui/TopBar'
import { useSettingsStore } from '@/stores/settings-store'

const AVATARS = ['🧒', '👦', '👧', '🧒🏻', '👦🏻', '👧🏻', '🦸', '🧙', '🧚', '🤖', '👽', '🐱', '🐶', '🦊', '🐼', '🐸']

export default function RegisterPage() {
  const router = useRouter()
  const lang = useSettingsStore(s => s.lang)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [avatar, setAvatar] = useState('🧒')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, avatar }),
      })

      if (res.status === 429) {
        setError(t(lang, 'authRateLimited'))
        return
      }

      const data = await res.json()

      if (!data.success) {
        setError(data.error ?? 'Đăng ký thất bại')
        return
      }

      // Auto sign in after register
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error === 'RateLimited' || result?.status === 429) {
        setError(t(lang, 'authRateLimited'))
      } else if (result?.error) {
        setError('Đăng ký thành công nhưng không thể đăng nhập tự động')
      } else {
        router.push('/')
        router.refresh()
      }
    } catch {
      setError(t(lang, 'authConnectionError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ui-page ui-page--narrow auth-page">
      <TopBar back={{ href: '/', label: t(lang, 'backHome').replace('← ', '') }} />
      <div className="ui-card auth-card">
        <div className="auth-mascot" aria-hidden>🦉</div>
        <h1 className="ui-title">Đăng ký</h1>
        <p className="ui-subtitle">Tạo tài khoản để lưu tiến bộ!</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="ui-label" role="group" aria-label="Avatar">
            😀 Chọn avatar
            <div className="avatar-picker">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  type="button"
                  className={`avatar-option ${a === avatar ? 'avatar-option--selected' : ''}`}
                  aria-pressed={a === avatar}
                  onClick={() => setAvatar(a)}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <label className="ui-label">
            👤 Tên hiển thị
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="ui-input"
              placeholder="Tên của bạn"
              required
              maxLength={50}
            />
          </label>

          <label className="ui-label">
            📧 Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="ui-input"
              placeholder="email@example.com"
              required
            />
          </label>

          <label className="ui-label">
            🔒 Mật khẩu (ít nhất 6 ký tự)
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="ui-input"
              placeholder="••••••"
              required
              minLength={6}
            />
          </label>

          <button type="submit" className="ui-btn ui-btn--primary ui-btn--block" disabled={loading}>
            {loading ? '⏳ Đang tạo...' : '🎉 Tạo tài khoản'}
          </button>
        </form>

        <div className="auth-divider">
          <span>hoặc</span>
        </div>

        <button
          type="button"
          className="ui-btn ui-btn--block"
          onClick={() => signIn('google', { callbackUrl: '/' })}
        >
          🌐 Đăng ký với Google
        </button>

        <p className="auth-link">
          Đã có tài khoản?{' '}
          <a href="/login">Đăng nhập</a>
        </p>
      </div>
    </div>
  )
}
