'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { t } from '@typing-adventure/i18n'
import { TopBar } from '@/components/ui/TopBar'
import { useSettingsStore } from '@/stores/settings-store'

export default function LoginPage() {
  const router = useRouter()
  const lang = useSettingsStore(s => s.lang)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error === 'RateLimited' || result?.status === 429) {
        setError(t(lang, 'authRateLimited'))
      } else if (result?.error) {
        setError('Email hoặc mật khẩu không đúng')
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
        <h1 className="ui-title">Đăng nhập</h1>
        <p className="ui-subtitle">Chào mừng bạn trở lại!</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
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
            🔒 Mật khẩu
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
            {loading ? '⏳ Đang đăng nhập...' : '🚀 Đăng nhập'}
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
          🌐 Đăng nhập với Google
        </button>

        <p className="auth-link">
          Chưa có tài khoản?{' '}
          <a href="/register">Đăng ký ngay</a>
        </p>
      </div>
    </div>
  )
}
