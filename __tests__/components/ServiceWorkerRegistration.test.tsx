import { render } from '@testing-library/react'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'
import { logger } from '@/lib/utils/logger'

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}))

describe('ServiceWorkerRegistration', () => {
  let mockRegister: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockRegister = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should return null (render nothing)', () => {
    const { container } = render(<ServiceWorkerRegistration />)
    expect(container.firstChild).toBeNull()
  })

  it('should not register service worker when serviceWorker is not supported', () => {
    const originalServiceWorkerDescriptor = Object.getOwnPropertyDescriptor(navigator, 'serviceWorker')
    Object.defineProperty(navigator, 'serviceWorker', {
      value: undefined,
      configurable: true,
    })

    render(<ServiceWorkerRegistration />)
    
    expect(logger.warn).not.toHaveBeenCalled()
    expect(logger.error).not.toHaveBeenCalled()

    if (originalServiceWorkerDescriptor) {
      Object.defineProperty(navigator, 'serviceWorker', originalServiceWorkerDescriptor)
    }
  })

  it('should attempt to register service worker when supported', async () => {
    mockRegister = jest.fn().mockResolvedValue({ scope: '/sw.js' })
    const originalServiceWorkerDescriptor = Object.getOwnPropertyDescriptor(navigator, 'serviceWorker')
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: mockRegister,
      },
      configurable: true,
    })

    render(<ServiceWorkerRegistration />)
    
    const loadEvent = new Event('load')
    window.dispatchEvent(loadEvent)

    await new Promise(resolve => setTimeout(resolve, 0))
    
    expect(mockRegister).toHaveBeenCalledWith('/sw.js')

    if (originalServiceWorkerDescriptor) {
      Object.defineProperty(navigator, 'serviceWorker', originalServiceWorkerDescriptor)
    }
  })

  it('should handle registration success', async () => {
    mockRegister = jest.fn().mockResolvedValue({ scope: '/sw.js' })
    const originalServiceWorkerDescriptor = Object.getOwnPropertyDescriptor(navigator, 'serviceWorker')
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: mockRegister,
      },
      configurable: true,
    })

    render(<ServiceWorkerRegistration />)
    
    const loadEvent = new Event('load')
    window.dispatchEvent(loadEvent)

    await new Promise(resolve => setTimeout(resolve, 0))
    
    expect(logger.warn).toHaveBeenCalledWith(
      'SW registered:',
      undefined,
      { scope: '/sw.js', module: 'ServiceWorkerRegistration' }
    )

    if (originalServiceWorkerDescriptor) {
      Object.defineProperty(navigator, 'serviceWorker', originalServiceWorkerDescriptor)
    }
  })

  it('should handle registration failure', async () => {
    mockRegister = jest.fn().mockRejectedValue(new Error('Registration failed'))
    const originalServiceWorkerDescriptor = Object.getOwnPropertyDescriptor(navigator, 'serviceWorker')
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: mockRegister,
      },
      configurable: true,
    })

    render(<ServiceWorkerRegistration />)
    
    const loadEvent = new Event('load')
    window.dispatchEvent(loadEvent)

    await new Promise(resolve => setTimeout(resolve, 0))
    
    expect(logger.error).toHaveBeenCalledWith(
      'SW registration failed',
      expect.any(Error),
      { module: 'ServiceWorkerRegistration' }
    )

    if (originalServiceWorkerDescriptor) {
      Object.defineProperty(navigator, 'serviceWorker', originalServiceWorkerDescriptor)
    }
  })
})
