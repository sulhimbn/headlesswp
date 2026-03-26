import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  enabled: Boolean(process.env.SENTRY_DSN),
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  integrations: [
    Sentry.httpIntegration(),
  ],
  beforeSend(event, hint) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Sentry] Error captured:', hint.originalException)
    }
    return event
  },
})
