'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

/**
 * Last line of defence: a crash in the root layout itself, where error.tsx
 * never gets to render. It replaces <html>, so it cannot rely on globals.css
 * having been applied and styles inline instead.
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="sr">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          background: '#FFFFFF',
          color: '#4B4B4B',
          fontFamily: 'Nunito, system-ui, -apple-system, sans-serif',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '22rem' }}>
          <div style={{ fontSize: '2.5rem' }}>⚠️</div>
          <h1 style={{ fontSize: '1.25rem', margin: '1rem 0 0.5rem' }}>Portal se nije učitao</h1>
          <p style={{ fontSize: '0.875rem', color: '#777777', margin: 0 }}>
            Greška je prijavljena. Osvježi stranicu da pokušaš ponovo.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1.5rem',
              padding: '0.75rem 1.25rem',
              border: 'none',
              borderRadius: '0.75rem',
              background: '#58CC02',
              boxShadow: '0 4px 0 #46A302',
              color: '#ffffff',
              fontSize: '0.875rem',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Osvježi
          </button>
        </div>
      </body>
    </html>
  )
}
