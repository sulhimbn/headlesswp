import { render, waitFor } from '@testing-library/react'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'
import { logger } from '@/lib/utils/logger'

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

describe('ServiceWorkerRegistration Component', () => {
  let originalNavigator: Navigator
  let addEventListenerSpy: jest.SpyInstance
  let removeEventListenerSpy: jest.SpyInstance

  beforeEach(() => {
    originalNavigator = { ...global.navigator }
    addEventListenerSpy = jest.spyOn(window, 'addEventListener')
    removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
    jest.clearAllMocks()
  })

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
    })
    addEventListenerSpy.mockRestore()
    removeEventListenerSpy.mockRestore()
  })

  describe('Rendering', () => {
    test('renders nothing (returns null)', () => {
      Object.defineProperty(global, 'navigator', {
        value: { serviceWorker: {} },
        writable: true,
      })

      const { container } = render(<ServiceWorkerRegistration />)
      expect(container.firstChild).toBeNull()
    })

    test('component renders without throwing when serviceWorker is not supported', () => {
      Object.defineProperty(global, 'navigator', {
        value: {},
        writable: true,
      })

      expect(() => {
        render(<ServiceWorkerRegistration />)
      }).not.toThrow()
    })
  })

  describe('Service Worker Registration', () => {
    test('attempts to register service worker when supported', async () => {
      const mockRegister = jest.fn().mockResolvedValue({ scope: '/test-scope' })
      Object.defineProperty(global, 'navigator', {
        value: {
          serviceWorker: {
            register: mockRegister,
          },
        },
        writable: true,
      })

      render(<ServiceWorkerRegistration />)

      await waitFor(() => {
        expect(addEventListenerSpy).toHaveBeenCalledWith('load', expect.any(Function))
      })

      const loadCallback = addEventListenerSpy.mock.calls.find(
        (call) => call[0] === 'load'
      )?.[1] as Function

      loadCallback()

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith('/sw.js')
      })
    })

    test('logs successful registration', async () => {
      const mockRegister = jest.fn().mockResolvedValue({ scope: '/test-scope' })
      Object.defineProperty(global, 'navigator', {
        value: {
          serviceWorker: {
            register: mockRegister,
          },
        },
        writable: true,
      })

      render(<ServiceWorkerRegistration />)

      const loadCallback = addEventListenerSpy.mock.calls.find(
        (call) => call[0] === 'load'
      )?.[1] as Function

      loadCallback()

      await waitFor(() => {
        expect(logger.warn).toHaveBeenCalledWith(
          'SW registered:',
          undefined,
          expect.objectContaining({
            scope: '/test-scope',
            module: 'ServiceWorkerRegistration',
          })
        )
      })
    })

    test('handles registration failure', async () => {
      const registrationError = new Error('Registration failed')
      const mockRegister = jest.fn().mockRejectedValue(registrationError)
      Object.defineProperty(global, 'navigator', {
        value: {
          serviceWorker: {
            register: mockRegister,
          },
        },
        writable: true,
      })

      render(<ServiceWorkerRegistration />)

      const loadCallback = addEventListenerSpy.mock.calls.find(
        (call) => call[0] === 'load'
      )?.[1] as Function

      loadCallback()

      await waitFor(() => {
        expect(logger.error).toHaveBeenCalledWith(
          'SW registration failed',
          registrationError,
          { module: 'ServiceWorkerRegistration' }
        )
      })
    })

    test('does not attempt registration when serviceWorker is not in navigator', () => {
      Object.defineProperty(global, 'navigator', {
        value: {},
        writable: true,
      })

      render(<ServiceWorkerRegistration />)

      expect(addEventListenerSpy).not.toHaveBeenCalled()
    })

    test('throws when navigator is undefined', () => {
      Object.defineProperty(global, 'navigator', {
        value: undefined,
        writable: true,
      })

      expect(() => {
        render(<ServiceWorkerRegistration />)
      }).toThrow()
    })
  })

  describe('Browser Environment Detection', () => {
    test('works when navigator.serviceWorker is undefined', () => {
      Object.defineProperty(global, 'navigator', {
        value: {},
        writable: true,
      })

      const { container } = render(<ServiceWorkerRegistration />)
      expect(container.firstChild).toBeNull()
    })

    test('throws when navigator.serviceWorker.register is not a function', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          serviceWorker: {
            register: 'not a function',
          },
        },
        writable: true,
      })

      render(<ServiceWorkerRegistration />)

      const loadCallback = addEventListenerSpy.mock.calls.find(
        (call) => call[0] === 'load'
      )?.[1] as Function

      expect(() => loadCallback()).toThrow()
    })
  })

  describe('Cleanup', () => {
    test('adds event listener for load event', () => {
      Object.defineProperty(global, 'navigator', {
        value: { serviceWorker: {} },
        writable: true,
      })

      render(<ServiceWorkerRegistration />)

      expect(addEventListenerSpy).toHaveBeenCalledWith('load', expect.any(Function))
    })
  })
})
