import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  environment: process.env.NODE_ENV,
  
  enabled: process.env.NODE_ENV === 'production',
  
  tracesSampleRate: 1.0,
  
  replaysOnErrorSampleRate: 1.0,
  
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  beforeSend(event) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Sentry] Event captured:', event.exception?.values?.[0]?.value)
    }
    return event
  },
})
