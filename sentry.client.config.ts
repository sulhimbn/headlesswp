import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  integrations: [
    Sentry.replayIntegration(),
    Sentry.browserTracingIntegration(),
  ],
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  tracePropagationTargets: ['localhost', /^https:\/\/.*\.your-domain\.com$/],
  tracesSampler: (samplingContext) => {
    if (samplingContext.parentSampled !== undefined) {
      return samplingContext.parentSampled
    }
    return 0.1
  },
  beforeSend(event) {
    if (event.user) {
      event.user.ip_address = '{{auto}}'
    }
    return event
  },
})
