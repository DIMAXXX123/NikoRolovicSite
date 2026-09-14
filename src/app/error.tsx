'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import * as Sentry from '@sentry/nextjs'
import { Home, RefreshCw } from 'lucide-react'

export default function Error({
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
    <div className="min-h-dvh flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-3xl">
          ⚠️
        </div>
        <h1 className="mt-5 text-xl font-bold text-foreground">Nešto je pošlo naopako</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Greška je prijavljena. Pokušaj ponovo — ako se ponovi, vrati se na početnu.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-[11px] text-muted-foreground/70">
            Kod greške: {error.digest}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Pokušaj ponovo
          </button>
          <Link
            href="/news"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            Početna
          </Link>
        </div>
      </div>
    </div>
  )
}
