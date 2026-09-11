'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'
import * as Sentry from '@sentry/nextjs'
import { RefreshCw } from 'lucide-react'

type Props = {
  children: ReactNode
  /** Rendered instead of the default card. Receives a reset() to try again. */
  fallback?: (error: Error, reset: () => void) => ReactNode
  /** Shown in the default card so the student knows what broke. */
  label?: string
}

type State = { error: Error | null }

/**
 * Catches a render crash in one part of the tree so the rest of the screen —
 * header, bottom nav, the other cards — keeps working. Next's error.tsx only
 * covers a whole route segment; this is for wrapping a single component.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    Sentry.captureException(error, {
      extra: { componentStack: info.componentStack, label: this.props.label },
    })
  }

  reset = () => this.setState({ error: null })

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    if (this.props.fallback) return this.props.fallback(error, this.reset)

    return (
      <div
        role="alert"
        className="rounded-2xl border border-border bg-card p-5 text-center text-sm text-muted-foreground"
      >
        <p className="font-medium text-foreground">
          {this.props.label ?? 'Ovaj dio stranice se nije učitao'}
        </p>
        <p className="mt-1">Pokušaj ponovo — ostatak stranice i dalje radi.</p>
        <button
          type="button"
          onClick={this.reset}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Pokušaj ponovo
        </button>
      </div>
    )
  }
}
