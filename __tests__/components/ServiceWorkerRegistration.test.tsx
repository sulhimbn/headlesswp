import { render, cleanup, act } from '@testing-library/react'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'

const mockWarn = jest.fn()
const mockError = jest.fn()
const mockAddEventListener = jest.fn((event: string, handler: () => void) => {
  if (event === 'load') {
    setTimeout(() => handler(), 0)
  }
})
const mockRemoveEventListener = jest.fn()
const mockRegister = jest.fn()

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    warn: (...args: unknown[]) => mockWarn(...args),
    error: (...args: unknown[]) => mockError(...args),
  },
}))

const originalAddEventListener = window.addEventListener
const originalRemoveEventListener = window.removeEventListener

describe('ServiceWorkerRegistration', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    Object.defineProperty(window, 'addEventListener', {
      configurable: true,
      get: () => mockAddEventListener,
    })

    Object.defineProperty(window, 'removeEventListener', {
      configurable: true,
      get: () => mockRemoveEventListener,
    })

    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      writable: true,
      value: undefined,
    })
  })

  afterEach(() => {
    cleanup()
    Object.defineProperty(window, 'addEventListener', {
      configurable: true,
      value: originalAddEventListener,
    })
    Object.defineProperty(window, 'removeEventListener', {
      configurable: true,
      value: originalRemoveEventListener,
    })
  })

  describe('Service worker registration success', () => {
    test('registers service worker on window load', async () => {
      const registration = { scope: '/scope/' }
      mockRegister.mockResolvedValue(registration)

      Object.defineProperty(window.navigator, 'serviceWorker', {
        configurable: true,
        writable: true,
        value: {
          register: mockRegister,
        },
      })

      render(<ServiceWorkerRegistration />)

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
      })

      expect(mockAddEventListener).toHaveBeenCalledWith('load', expect.any(Function))
      expect(mockRegister).toHaveBeenCalledWith('/sw.js')
      expect(mockWarn).toHaveBeenCalledWith(
        'SW registered:',
        undefined,
        expect.objectContaining({ scope: '/scope/', module: 'ServiceWorkerRegistration' })
      )
    })
  })

  describe('Service worker registration failure', () => {
    test('logs error when registration fails', async () => {
      const registrationError = new Error('Registration failed')
      mockRegister.mockRejectedValue(registrationError)

      Object.defineProperty(window.navigator, 'serviceWorker', {
        configurable: true,
        writable: true,
        value: {
          register: mockRegister,
        },
      })

      render(<ServiceWorkerRegistration />)

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
      })

      expect(mockRegister).toHaveBeenCalledWith('/sw.js')
      expect(mockError).toHaveBeenCalledWith(
        'SW registration failed',
        registrationError,
        { module: 'ServiceWorkerRegistration' }
      )
    })
  })

  describe('Fallback for browsers without service worker support', () => {
    test('does not attempt registration when service worker is not supported', () => {
      delete (window.navigator as { serviceWorker?: unknown }).serviceWorker

      render(<ServiceWorkerRegistration />)

      expect(mockAddEventListener).not.toHaveBeenCalled()
    })
  })

  describe('Cleanup on unmount', () => {
    test('component unmounts without errors', () => {
      mockRegister.mockResolvedValue({ scope: '/scope/' })

      Object.defineProperty(window.navigator, 'serviceWorker', {
        configurable: true,
        writable: true,
        value: {
          register: mockRegister,
        },
      })

      const { unmount } = render(<ServiceWorkerRegistration />)

      expect(mockAddEventListener).toHaveBeenCalledWith('load', expect.any(Function))

      expect(() => unmount()).not.toThrow()

      expect(mockRemoveEventListener).not.toHaveBeenCalled()
    })
  })
})