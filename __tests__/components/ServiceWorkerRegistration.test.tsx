import { render, waitFor, act } from '@testing-library/react'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

describe('ServiceWorkerRegistration Component', () => {
  let originalServiceWorker: typeof navigator.serviceWorker
  let mockRegister: jest.Mock
  let addEventListenerHandler: ((...args: unknown[]) => void) | null

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockRegister = jest.fn()
    addEventListenerHandler = null
    
    const mockAddEventListener = jest.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (event === 'load') {
        addEventListenerHandler = handler
      }
    })
    
    originalServiceWorker = navigator.serviceWorker
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: mockRegister,
        addEventListener: mockAddEventListener,
      },
      writable: true,
    })
    
    const originalAddEventListener = window.addEventListener
    ;(window.addEventListener as jest.Mock) = jest.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (event === 'load') {
        addEventListenerHandler = handler
      }
      originalAddEventListener.call(window, event, handler)
    })
  })

  afterEach(() => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: originalServiceWorker,
      writable: true,
    })
  })

  describe('Rendering', () => {
    test('renders null (returns null)', () => {
      const { container } = render(<ServiceWorkerRegistration />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Service Worker Registration', () => {
    test.todo('does not register service worker when serviceWorker is not supported')

    test('registers service worker when supported', async () => {
      mockRegister.mockResolvedValue({ scope: '/sw.js' })

      render(<ServiceWorkerRegistration />)
      
      await act(async () => {
        if (addEventListenerHandler) {
          addEventListenerHandler()
        }
      })

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith('/sw.js')
      })
    })

    test('adds load event listener to window', async () => {
      render(<ServiceWorkerRegistration />)

      await waitFor(() => {
        expect(window.addEventListener).toHaveBeenCalledWith('load', expect.any(Function))
      })
    })

    test('logs warning on successful registration', async () => {
      const mockLogger = require('@/lib/utils/logger').logger
      mockRegister.mockResolvedValue({ scope: '/sw.js' })

      render(<ServiceWorkerRegistration />)
      
      await act(async () => {
        if (addEventListenerHandler) {
          addEventListenerHandler()
        }
      })

      await waitFor(() => {
        expect(mockLogger.warn).toHaveBeenCalledWith(
          'SW registered:',
          undefined,
          expect.objectContaining({ scope: '/sw.js', module: 'ServiceWorkerRegistration' })
        )
      })
    })

    test('logs error on registration failure', async () => {
      const mockLogger = require('@/lib/utils/logger').logger
      const registrationError = new Error('Registration failed')
      mockRegister.mockRejectedValue(registrationError)

      render(<ServiceWorkerRegistration />)
      
      await act(async () => {
        if (addEventListenerHandler) {
          addEventListenerHandler()
        }
      })

      await waitFor(() => {
        expect(mockLogger.error).toHaveBeenCalledWith(
          'SW registration failed',
          registrationError,
          { module: 'ServiceWorkerRegistration' }
        )
      })
    })
  })

  describe('Effect Behavior', () => {
    test('runs effect only once (empty dependency array)', async () => {
      mockRegister.mockResolvedValue({ scope: '/sw.js' })
      
      render(<ServiceWorkerRegistration />)
      render(<ServiceWorkerRegistration />)

      await act(async () => {
        if (addEventListenerHandler) {
          addEventListenerHandler()
        }
      })

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledTimes(1)
      })
    })
  })
})
