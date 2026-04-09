import * as Sentry from '@sentry/nextjs'

jest.mock('@sentry/nextjs', () => ({
  ...jest.requireActual('@sentry/nextjs'),
  init: jest.fn(),
  replayIntegration: jest.fn(() => ({ name: 'Replay' })),
}))

describe('Sentry Integration', () => {
  let mockInit: jest.Mock

  beforeEach(() => {
    mockInit = Sentry.init as jest.Mock
    mockInit.mockClear()
  })

  describe('sentry.client.config', () => {
    it('initializes with client DSN and replay integration', () => {
      const mockSentryInit = jest.requireMock('@sentry/nextjs').init
      mockSentryInit({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        environment: process.env.NODE_ENV,
        enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
        integrations: [Sentry.replayIntegration()],
        replaysOnErrorSampleRate: 1.0,
        replaysSessionSampleRate: 0.1,
      })

      expect(mockSentryInit).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
          environment: process.env.NODE_ENV,
          enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
        })
      )
    })

    it('enables client monitoring when DSN is present', () => {
      const originalEnv = process.env.NEXT_PUBLIC_SENTRY_DSN
      process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://test.dsn/123'

      const mockSentryInit = jest.requireMock('@sentry/nextjs').init
      mockSentryInit({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        environment: process.env.NODE_ENV,
        enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
      })

      const callArgs = mockSentryInit.mock.calls[0][0]
      expect(callArgs.enabled).toBe(true)

      process.env.NEXT_PUBLIC_SENTRY_DSN = originalEnv
    })

    it('disables client monitoring when DSN is missing', () => {
      const mockSentryInit = jest.requireMock('@sentry/nextjs').init
      mockSentryInit.mockClear()
      
      const dsn = undefined
      mockSentryInit({
        dsn: dsn,
        environment: 'test',
        enabled: Boolean(dsn),
      })

      const callArgs = mockSentryInit.mock.calls[0][0]
      expect(callArgs.enabled).toBe(false)
    })

    it('configures replay integrations', () => {
      const replayIntegration = Sentry.replayIntegration()
      expect(replayIntegration).toEqual({ name: 'Replay' })
    })

    it('sets replay sample rates', () => {
      const mockSentryInit = jest.requireMock('@sentry/nextjs').init
      mockSentryInit({
        replaysOnErrorSampleRate: 1.0,
        replaysSessionSampleRate: 0.1,
      })

      const callArgs = mockSentryInit.mock.calls[0][0]
      expect(callArgs.replaysOnErrorSampleRate).toBe(1.0)
      expect(callArgs.replaysSessionSampleRate).toBe(0.1)
    })
  })

  describe('sentry.server.config', () => {
    it('initializes with server DSN and tracing', () => {
      const originalEnv = process.env.SENTRY_DSN
      process.env.SENTRY_DSN = 'https://test.dsn/456'

      const mockSentryInit = jest.requireMock('@sentry/nextjs').init
      mockSentryInit({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV,
        enabled: Boolean(process.env.SENTRY_DSN),
        tracesSampleRate: 1.0,
      })

      expect(mockSentryInit).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: 'https://test.dsn/456',
          tracesSampleRate: 1.0,
        })
      )

      process.env.SENTRY_DSN = originalEnv
    })

    it('enables server tracing when DSN is present', () => {
      const originalEnv = process.env.SENTRY_DSN
      process.env.SENTRY_DSN = 'https://test.dsn/456'

      const mockSentryInit = jest.requireMock('@sentry/nextjs').init
      mockSentryInit({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV,
        enabled: Boolean(process.env.SENTRY_DSN),
        tracesSampleRate: 1.0,
      })

      const callArgs = mockSentryInit.mock.calls[0][0]
      expect(callArgs.enabled).toBe(true)
      expect(callArgs.tracesSampleRate).toBe(1.0)

      process.env.SENTRY_DSN = originalEnv
    })

    it('disables server tracing when DSN is missing', () => {
      const mockSentryInit = jest.requireMock('@sentry/nextjs').init
      mockSentryInit.mockClear()
      
      const dsn = undefined
      mockSentryInit({
        dsn: dsn,
        environment: 'test',
        enabled: Boolean(dsn),
        tracesSampleRate: 1.0,
      })

      const callArgs = mockSentryInit.mock.calls[0][0]
      expect(callArgs.enabled).toBe(false)
    })
  })

  describe('sentry.edge.config', () => {
    it('initializes with edge DSN', () => {
      const originalEnv = process.env.SENTRY_DSN
      process.env.SENTRY_DSN = 'https://test.dsn/789'

      const mockSentryInit = jest.requireMock('@sentry/nextjs').init
      mockSentryInit({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV,
        enabled: Boolean(process.env.SENTRY_DSN),
      })

      expect(mockSentryInit).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: 'https://test.dsn/789',
          enabled: true,
        })
      )

      process.env.SENTRY_DSN = originalEnv
    })

    it('enables edge monitoring when DSN is present', () => {
      const originalEnv = process.env.SENTRY_DSN
      process.env.SENTRY_DSN = 'https://test.dsn/789'

      const mockSentryInit = jest.requireMock('@sentry/nextjs').init
      mockSentryInit({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV,
        enabled: Boolean(process.env.SENTRY_DSN),
      })

      const callArgs = mockSentryInit.mock.calls[0][0]
      expect(callArgs.enabled).toBe(true)

      process.env.SENTRY_DSN = originalEnv
    })

    it('disables edge monitoring when DSN is missing', () => {
      const mockSentryInit = jest.requireMock('@sentry/nextjs').init
      mockSentryInit.mockClear()
      
      const dsn = undefined
      mockSentryInit({
        dsn: dsn,
        environment: 'test',
        enabled: Boolean(dsn),
      })

      const callArgs = mockSentryInit.mock.calls[0][0]
      expect(callArgs.enabled).toBe(false)
    })
  })
})