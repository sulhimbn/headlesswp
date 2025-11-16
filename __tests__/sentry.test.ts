import { captureError, captureMessage, setUser, addBreadcrumb } from '@/lib/sentry'

// Mock Sentry
jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setTags: jest.fn(),
  setExtras: jest.fn(),
  setUser: jest.fn(),
  addBreadcrumb: jest.fn(),
}))

describe('Sentry Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('captureError', () => {
    it('should capture Error object', () => {
      const error = new Error('Test error')
      const context = {
        tags: { type: 'test' },
        extra: { data: 'test' },
        user: { id: '123' },
      }

      captureError(error, context)

      const { setTags, setExtras, setUser, captureException } = require('@sentry/nextjs')
      
      expect(setTags).toHaveBeenCalledWith({ type: 'test' })
      expect(setExtras).toHaveBeenCalledWith({ data: 'test' })
      expect(setUser).toHaveBeenCalledWith({ id: '123' })
      expect(captureException).toHaveBeenCalledWith(error)
    })

    it('should convert string to Error', () => {
      const errorMessage = 'Test error message'

      captureError(errorMessage)

      const { captureException } = require('@sentry/nextjs')
      
      expect(captureException).toHaveBeenCalledWith(expect.any(Error))
      expect(captureException.mock.calls[0][0].message).toBe(errorMessage)
    })

    it('should work without context', () => {
      const error = new Error('Test error')

      captureError(error)

      const { captureException } = require('@sentry/nextjs')
      
      expect(captureException).toHaveBeenCalledWith(error)
    })
  })

  describe('captureMessage', () => {
    it('should capture message with default level', () => {
      const message = 'Test message'

      captureMessage(message)

      const { captureMessage: sentryCaptureMessage } = require('@sentry/nextjs')
      
      expect(sentryCaptureMessage).toHaveBeenCalledWith(message, 'info')
    })

    it('should capture message with custom level', () => {
      const message = 'Warning message'

      captureMessage(message, 'warning')

      const { captureMessage: sentryCaptureMessage } = require('@sentry/nextjs')
      
      expect(sentryCaptureMessage).toHaveBeenCalledWith(message, 'warning')
    })

    it('should include context', () => {
      const message = 'Test message'
      const context = {
        tags: { component: 'test' },
        extra: { value: 123 },
      }

      captureMessage(message, 'info', context)

      const { setTags, setExtras, captureMessage: sentryCaptureMessage } = require('@sentry/nextjs')
      
      expect(setTags).toHaveBeenCalledWith({ component: 'test' })
      expect(setExtras).toHaveBeenCalledWith({ value: 123 })
      expect(sentryCaptureMessage).toHaveBeenCalledWith(message, 'info')
    })
  })

  describe('setUser', () => {
    it('should set user context', () => {
      const user = { id: '123', email: 'test@example.com' }

      setUser(user)

      const { setUser: sentrySetUser } = require('@sentry/nextjs')
      
      expect(sentrySetUser).toHaveBeenCalledWith(user)
    })

    it('should clear user context when null', () => {
      setUser(null)

      const { setUser: sentrySetUser } = require('@sentry/nextjs')
      
      expect(sentrySetUser).toHaveBeenCalledWith(null)
    })
  })

  describe('addBreadcrumb', () => {
    it('should add breadcrumb', () => {
      const breadcrumb = {
        message: 'Test breadcrumb',
        category: 'test',
        level: 'info',
      }

      addBreadcrumb(breadcrumb)

      const { addBreadcrumb: sentryAddBreadcrumb } = require('@sentry/nextjs')
      
      expect(sentryAddBreadcrumb).toHaveBeenCalledWith(breadcrumb)
    })
  })
})