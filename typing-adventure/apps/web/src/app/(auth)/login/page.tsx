'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError('Email hoặc mật khẩu không đúng')
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-emoji">🎹</div>
        <h1 className="auth-title">Đăng nhập</h1>
        <p className="auth-subtitle">Chào mừng bạn trở lại!</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-label">
            📧 Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              placeholder="email@example.com"
              required
            />
          </label>

          <label className="auth-label">
            🔒 Mật khẩu
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              placeholder="••••••"
              required
              minLength={6}
            />
          </label>

          <button type="submit" className="btn auth-btn-primary" disabled={loading}>
            {loading ? '⏳ Đang đăng nhập...' : '🚀 Đăng nhập'}
          </button>
        </form>

        <div className="auth-divider">
          <span>hoặc</span>
        </div>

        <button
          className="btn auth-btn-google"
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
