import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

// No DSN configured (local dev, preview without secrets) — stay a no-op rather
// than spamming the console on every page load.
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    // The audience is students on mobile data: sample traces, keep every error.
    tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    sendDefaultPii: false,
    debug: false,
  })
}

// Lets Sentry tie a client-side navigation to the transaction it starts.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
