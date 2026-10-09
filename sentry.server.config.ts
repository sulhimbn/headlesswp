import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  enabled: Boolean(process.env.SENTRY_DSN),
  // PERF-MON-002: 10% trace sampling to bound APM volume.
  // Override per-environment via SENTRY_TRACES_SAMPLE_RATE.
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
})
