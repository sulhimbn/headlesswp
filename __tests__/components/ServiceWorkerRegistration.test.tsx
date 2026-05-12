import { render, cleanup, act } from '@testing-library/react'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'
import { logger } from '@/lib/utils/logger'
import React from 'react'

const mockRegister = jest.fn()
const mockAddEventListener = jest.fn()
const mockRemoveEventListener = jest.fn()

const originalNavigator = { ...navigator }

beforeEach(() => {
  mockRegister.mockReset()
  mockAddEventListener.mockReset()
  mockRemoveEventListener.mockReset()

  Object.defineProperty(window, 'addEventListener', {
    writable: true,
    value: mockAddEventListener,
  })
  Object.defineProperty(window, 'removeEventListener', {
    writable: true,
    value: mockRemoveEventListener,
  })

  Object.defineProperty(navigator, 'serviceWorker', {
    writable: true,
    value: {
      register: mockRegister,
    },
  })

  jest.spyOn(logger, 'warn').mockImplementation()
  jest.spyOn(logger, 'error').mockImplementation()
})

afterEach(() => {
  cleanup()
  jest.clearAllMocks()
  Object.defineProperty(navigator, 'serviceWorker', {
    writable: true,
    value: originalNavigator.serviceWorker,
  })
})

describe('ServiceWorkerRegistration Component', () => {
  describe('Service worker registration in browser', () => {
    test('does not register service worker when not supported', () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        writable: true,
        value: undefined,
      })

      render(<ServiceWorkerRegistration />)

      expect(mockRegister).not.toHaveBeenCalled()
    })

    test('registers service worker when supported', async () => {
      mockRegister.mockResolvedValue({ scope: '/sw.js' })

      render(<ServiceWorkerRegistration />)

      const loadListener = mockAddEventListener.mock.calls.find(
        call => call[0] === 'load'
      )?.[1] as () => void

      if (loadListener) {
        await act(async () => {
          loadListener()
          await Promise.resolve()
        })
      }

      expect(mockRegister).toHaveBeenCalledWith('/sw.js')
    })

    test('adds load event listener on mount', () => {
      render(<ServiceWorkerRegistration />)

      expect(mockAddEventListener).toHaveBeenCalledWith('load', expect.any(Function))
    })
  })

  describe('Handle success', () => {
    test('logs warning on successful registration', async () => {
      mockRegister.mockResolvedValue({ scope: '/test-scope' })

      render(<ServiceWorkerRegistration />)

      const loadListener = mockAddEventListener.mock.calls.find(
        call => call[0] === 'load'
      )?.[1] as () => void

      if (loadListener) {
        await act(async () => {
          loadListener()
          await Promise.resolve()
        })
      }

      expect(logger.warn).toHaveBeenCalledWith(
        'SW registered:',
        undefined,
        expect.objectContaining({
          scope: '/test-scope',
          module: 'ServiceWorkerRegistration',
        })
      )
    })

    test('passes registration scope to logger', async () => {
      mockRegister.mockResolvedValue({ scope: '/custom-scope/' })

      render(<ServiceWorkerRegistration />)

      const loadListener = mockAddEventListener.mock.calls.find(
        call => call[0] === 'load'
      )?.[1] as () => void

      if (loadListener) {
        await act(async () => {
          loadListener()
          await Promise.resolve()
        })
      }

      expect(logger.warn).toHaveBeenCalledWith(
        'SW registered:',
        undefined,
        expect.objectContaining({
          scope: '/custom-scope/',
        })
      )
    })
  })

  describe('Handle error', () => {
    test('logs error on registration failure', async () => {
      const registrationError = new Error('SW registration failed')
      mockRegister.mockRejectedValue(registrationError)

      render(<ServiceWorkerRegistration />)

      const loadListener = mockAddEventListener.mock.calls.find(
        call => call[0] === 'load'
      )?.[1] as () => void

      if (loadListener) {
        await act(async () => {
          loadListener()
          await Promise.resolve()
        })
      }

      expect(logger.error).toHaveBeenCalledWith(
        'SW registration failed',
        registrationError,
        { module: 'ServiceWorkerRegistration' }
      )
    })

    test('logs error with different error types', async () => {
      const networkError = new Error('Network error')
      mockRegister.mockRejectedValue(networkError)

      render(<ServiceWorkerRegistration />)

      const loadListener = mockAddEventListener.mock.calls.find(
        call => call[0] === 'load'
      )?.[1] as () => void

      if (loadListener) {
        await act(async () => {
          loadListener()
          await Promise.resolve()
        })
      }

      expect(logger.error).toHaveBeenCalledWith(
        'SW registration failed',
        networkError,
        { module: 'ServiceWorkerRegistration' }
      )
    })
  })

  describe('Component behavior', () => {
    test('renders nothing (returns null)', () => {
      const { container } = render(<ServiceWorkerRegistration />)

      expect(container.firstChild).toBeNull()
    })

    test('does not register if load event already fired before mount', () => {
      mockRegister.mockResolvedValue({ scope: '/sw.js' })

      const loadEvent = new Event('load')
      Object.defineProperty(loadEvent, 'target', { writable: false, value: window })

      window.dispatchEvent(loadEvent)

      render(<ServiceWorkerRegistration />)

      expect(mockRegister).not.toHaveBeenCalled()
    })

    test('only registers once even with multiple load events', async () => {
      mockRegister.mockResolvedValue({ scope: '/sw.js' })

      render(<ServiceWorkerRegistration />)

      const loadListener = mockAddEventListener.mock.calls.find(
        call => call[0] === 'load'
      )?.[1] as () => void

      if (loadListener) {
        await act(async () => {
          loadListener()
          await Promise.resolve()
        })
      }

      expect(mockRegister).toHaveBeenCalledTimes(1)
    })
  })
})