import { render, cleanup, act } from '@testing-library/react'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'
import { logger } from '@/lib/utils/logger'

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

const mockLogger = logger as jest.Mocked<typeof logger>

describe('ServiceWorkerRegistration Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Object.defineProperty(window.navigator, 'serviceWorker', {
      value: { register: jest.fn() },
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    cleanup()
  })

  const setServiceWorkerMock = (registerFn: jest.Mock) => {
    Object.defineProperty(window.navigator, 'serviceWorker', {
      value: { register: registerFn },
      writable: true,
      configurable: true,
    })
  }

  describe('Rendering', () => {
    test('renders null (no UI)', () => {
      const { container } = render(<ServiceWorkerRegistration />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Service Worker Registration', () => {
    test('service worker registration is attempted when serviceWorker is available', async () => {
      const registerSpy = jest.fn().mockResolvedValue({ scope: '/test-scope' })
      setServiceWorkerMock(registerSpy)

      await act(async () => {
        render(<ServiceWorkerRegistration />)
        window.dispatchEvent(new Event('load'))
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(registerSpy).toHaveBeenCalledWith('/sw.js')
    })

    test('registration success triggers log', async () => {
      const registerSpy = jest.fn().mockResolvedValue({ scope: '/test-scope' })
      setServiceWorkerMock(registerSpy)

      await act(async () => {
        render(<ServiceWorkerRegistration />)
        window.dispatchEvent(new Event('load'))
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'SW registered:',
        undefined,
        expect.objectContaining({
          scope: '/test-scope',
          module: 'ServiceWorkerRegistration',
        })
      )
    })

    test('registration failure triggers error log', async () => {
      const registerSpy = jest.fn().mockRejectedValue(new Error('Registration failed'))
      setServiceWorkerMock(registerSpy)

      await act(async () => {
        render(<ServiceWorkerRegistration />)
        window.dispatchEvent(new Event('load'))
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(mockLogger.error).toHaveBeenCalledWith(
        'SW registration failed',
        expect.any(Error),
        expect.objectContaining({
          module: 'ServiceWorkerRegistration',
        })
      )
    })

    test('graceful handling when serviceWorker unavailable', async () => {
      Object.defineProperty(window.navigator, 'serviceWorker', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      await act(async () => {
        render(<ServiceWorkerRegistration />)
        window.dispatchEvent(new Event('load'))
      })

      expect('serviceWorker' in navigator).toBe(false)
      expect(mockLogger.warn).not.toHaveBeenCalled()
      expect(mockLogger.error).not.toHaveBeenCalled()
    })

    test('cleanup on unmount does not prevent already triggered registration', async () => {
      const registerSpy = jest.fn().mockResolvedValue({ scope: '/test-scope' })
      setServiceWorkerMock(registerSpy)

      let unmountFn: () => void
      await act(async () => {
        const result = render(<ServiceWorkerRegistration />)
        unmountFn = result.unmount
        window.dispatchEvent(new Event('load'))
        await Promise.resolve()
      })

      unmountFn!()
      await Promise.resolve()

      expect(mockLogger.warn).toHaveBeenCalled()
    })
  })
})