import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 100% of errors, 10% of performance traces
  tracesSampleRate: 0.1,

  // Only enable in production — keeps dev console clean
  enabled: process.env.NODE_ENV === 'production',
})
