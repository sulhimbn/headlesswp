import { render } from '@testing-library/react'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'
import { logger } from '@/lib/utils/logger'

jest.mock('@/lib/utils/logger')

describe('ServiceWorkerRegistration Component', () => {
  const originalNavigator = navigator

  beforeEach(() => {
    jest.clearAllMocks()
    
    Object.defineProperty(window, 'navigator', {
      value: { ...originalNavigator, serviceWorker: undefined },
      writable: true,
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'navigator', {
      value: originalNavigator,
      writable: true,
    })
  })

  describe('Rendering', () => {
    test('returns null (renders nothing)', () => {
      const { container } = render(<ServiceWorkerRegistration />)
      expect(container.firstChild).toBeNull()
    })

    test('does not render any DOM elements', () => {
      const { container } = render(<ServiceWorkerRegistration />)
      expect(container.innerHTML).toBe('')
    })
  })

  describe('Service Worker Registration', () => {
    let addEventListenerSpy: jest.SpyInstance
    let serviceWorkerRegisterSpy: jest.SpyInstance

    beforeEach(() => {
      addEventListenerSpy = jest.spyOn(window, 'addEventListener')
      serviceWorkerRegisterSpy = jest.fn().mockResolvedValue({ scope: '/sw.js' })
      
      Object.defineProperty(window, 'navigator', {
        value: {
          ...originalNavigator,
          serviceWorker: {
            register: serviceWorkerRegisterSpy,
          },
        },
        writable: true,
      })
    })

    afterEach(() => {
      addEventListenerSpy.mockRestore()
    })

    test('registers service worker when supported', async () => {
      render(<ServiceWorkerRegistration />)

      expect(addEventListenerSpy).toHaveBeenCalledWith('load', expect.any(Function))

      const loadCallback = addEventListenerSpy.mock.calls.find(
        (call) => call[0] === 'load'
      )?.[1] as () => void

      if (loadCallback) {
        loadCallback()
      }

      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(serviceWorkerRegisterSpy).toHaveBeenCalledWith('/sw.js')
    })

    test('logs successful registration', async () => {
      const mockRegistration = { scope: '/test-scope' }
      serviceWorkerRegisterSpy = jest.fn().mockResolvedValue(mockRegistration)
      
      Object.defineProperty(window, 'navigator', {
        value: {
          ...originalNavigator,
          serviceWorker: {
            register: serviceWorkerRegisterSpy,
          },
        },
        writable: true,
      })

      render(<ServiceWorkerRegistration />)

      const loadCallback = addEventListenerSpy.mock.calls.find(
        (call) => call[0] === 'load'
      )?.[1] as () => void

      if (loadCallback) {
        loadCallback()
      }

      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(logger.warn).toHaveBeenCalledWith(
        'SW registered:',
        undefined,
        { scope: '/test-scope', module: 'ServiceWorkerRegistration' }
      )
    })

    test('logs registration failure', async () => {
      const registrationError = new Error('Registration failed')
      serviceWorkerRegisterSpy = jest.fn().mockRejectedValue(registrationError)
      
      Object.defineProperty(window, 'navigator', {
        value: {
          ...originalNavigator,
          serviceWorker: {
            register: serviceWorkerRegisterSpy,
          },
        },
        writable: true,
      })

      render(<ServiceWorkerRegistration />)

      const loadCallback = addEventListenerSpy.mock.calls.find(
        (call) => call[0] === 'load'
      )?.[1] as () => void

      if (loadCallback) {
        loadCallback()
      }

      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(logger.error).toHaveBeenCalledWith(
        'SW registration failed',
        registrationError,
        { module: 'ServiceWorkerRegistration' }
      )
    })
  })

  describe('Browser Environment Detection', () => {
    test('does not register service worker when not supported', () => {
      const { navigator: nav } = window
      Object.defineProperty(window, 'navigator', {
        value: { ...nav },
        writable: true,
      })
      delete (window.navigator as any).serviceWorker

      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')

      render(<ServiceWorkerRegistration />)

      expect(addEventListenerSpy).not.toHaveBeenCalled()
      addEventListenerSpy.mockRestore()
    })

    test('does not throw when serviceWorker is not available', () => {
      const { navigator: nav } = window
      Object.defineProperty(window, 'navigator', {
        value: { ...nav },
        writable: true,
      })
      delete (window.navigator as any).serviceWorker

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      expect(() => {
        render(<ServiceWorkerRegistration />)
      }).not.toThrow()

      consoleSpy.mockRestore()
    })
  })

  describe('Component Behavior', () => {
    test('registers service worker only once on mount', () => {
      const serviceWorkerRegisterSpy = jest.fn().mockResolvedValue({ scope: '/sw.js' })
      
      Object.defineProperty(window, 'navigator', {
        value: {
          ...originalNavigator,
          serviceWorker: {
            register: serviceWorkerRegisterSpy,
          },
        },
        writable: true,
      })

      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')

      render(<ServiceWorkerRegistration />)

      const loadCallback = addEventListenerSpy.mock.calls.find(
        (call) => call[0] === 'load'
      )?.[1] as () => void

      if (loadCallback) {
        loadCallback()
      }

      expect(serviceWorkerRegisterSpy).toHaveBeenCalledTimes(1)

      addEventListenerSpy.mockRestore()
    })
  })
})
