import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  environment: process.env.NODE_ENV,
  
  enabled: process.env.NODE_ENV === 'production',
  
  tracesSampleRate: 1.0,
  
  beforeSend(event) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Sentry] Edge event captured:', event.exception?.values?.[0]?.value)
    }
    return event
  },
})
