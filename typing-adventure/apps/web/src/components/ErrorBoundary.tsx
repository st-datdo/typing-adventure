'use client'

import { Component, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Report to Sentry if available
    if (typeof window !== 'undefined') {
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } })
      }).catch(() => {
        // Sentry not installed yet, silently continue
      })
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 20px',
          textAlign: 'center',
          gap: 12,
        }}>
          <div style={{ fontSize: '2.5rem' }}>😵</div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Something went wrong</h2>
          <p style={{ color: 'var(--color-text-dim)', fontSize: '0.85rem', maxWidth: 400 }}>
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: 8,
              padding: '8px 20px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-accent)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
