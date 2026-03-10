import { render, waitFor } from '@testing-library/react'
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
    mockRegister = jest.fn()
    Object.defineProperty(global.navigator, 'serviceWorker', {
      value: {
        register: mockRegister,
      },
      writable: true,
    })
    jest.clearAllMocks()
  })

  afterEach(() => {
    Object.defineProperty(global.navigator, 'serviceWorker', {
      value: undefined,
      writable: true,
    })
  })

  it('should render null', () => {
    const { container } = render(<ServiceWorkerRegistration />)
    expect(container.firstChild).toBeNull()
  })

  it('should register service worker on mount when supported', async () => {
    mockRegister.mockResolvedValue({ scope: '/sw.js' })

    render(<ServiceWorkerRegistration />)

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('/sw.js')
    })
  })

  it('should not register service worker when not supported', () => {
    Object.defineProperty(global.navigator, 'serviceWorker', {
      value: undefined,
      writable: true,
    })

    render(<ServiceWorkerRegistration />)

    expect(mockRegister).not.toHaveBeenCalled()
  })
})
