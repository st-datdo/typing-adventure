'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '40px 20px',
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif',
          background: '#0f0f1a',
          color: '#fff',
          gap: 16,
        }}>
          <div style={{ fontSize: '3rem' }}>💥</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
            Something went terribly wrong
          </h2>
          <p style={{ color: '#888', fontSize: '0.9rem', maxWidth: 500 }}>
            We&apos;ve been notified and are looking into it. Please try again.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 12,
              padding: '10px 24px',
              borderRadius: 8,
              background: '#7c4dff',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.9rem',
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  )
}
