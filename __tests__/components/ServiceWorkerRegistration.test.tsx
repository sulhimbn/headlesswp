import { render } from '@testing-library/react'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'
import { logger } from '@/lib/utils/logger'

const mockRegister = jest.fn()

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

describe('ServiceWorkerRegistration Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRegister.mockReset()
    mockRegister.mockImplementation(() => Promise.resolve({ scope: '/test' }))
    
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register: mockRegister },
      writable: true,
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('renders nothing (returns null)', () => {
    const { container } = render(<ServiceWorkerRegistration />)
    expect(container.firstChild).toBeNull()
  })

  test('component does not throw on unmount', () => {
    const { unmount } = render(<ServiceWorkerRegistration />)
    expect(() => unmount()).not.toThrow()
  })
})
