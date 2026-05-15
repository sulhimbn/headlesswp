import { render, act } from '@testing-library/react'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'
import React from 'react'

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

const { logger } = require('@/lib/utils/logger')

const mockRegister = jest.fn()

beforeAll(() => {
  Object.defineProperty(navigator, 'serviceWorker', {
    value: {
      register: mockRegister,
    },
    configurable: true,
  })
  Object.defineProperty(navigator, 'serviceWorker', {
    value: { register: mockRegister },
    writable: true,
  })
})

beforeEach(() => {
  jest.clearAllMocks()
  mockRegister.mockReset()
})

describe('ServiceWorkerRegistration', () => {
  test('renders null (no UI)', () => {
    const { container } = render(<ServiceWorkerRegistration />)
    expect(container.firstChild).toBeNull()
  })

  test('service worker registration is attempted in browser environment', async () => {
    mockRegister.mockResolvedValue({ scope: '/test-scope' })

    render(<ServiceWorkerRegistration />)

    await act(async () => {
      window.dispatchEvent(new Event('load'))
    })

    expect(mockRegister).toHaveBeenCalledWith('/sw.js')
  })

  test('registration success triggers warning log', async () => {
    const mockRegistration = { scope: '/test-scope' }
    mockRegister.mockResolvedValue(mockRegistration)

    render(<ServiceWorkerRegistration />)

    await act(async () => {
      window.dispatchEvent(new Event('load'))
    })

    expect(logger.warn).toHaveBeenCalledWith('SW registered:', undefined, { scope: '/test-scope', module: 'ServiceWorkerRegistration' })
  })

  test('registration failure triggers error log', async () => {
    const mockError = new Error('Registration failed')
    mockRegister.mockRejectedValue(mockError)

    render(<ServiceWorkerRegistration />)

    await act(async () => {
      window.dispatchEvent(new Event('load'))
    })

    expect(logger.error).toHaveBeenCalledWith('SW registration failed', mockError, { module: 'ServiceWorkerRegistration' })
  })

  test('graceful handling when serviceWorker is not available', () => {
    const originalServiceWorker = navigator.serviceWorker
    Object.defineProperty(navigator, 'serviceWorker', {
      value: undefined,
      configurable: true,
    })

    render(<ServiceWorkerRegistration />)

    expect(mockRegister).not.toHaveBeenCalled()

    Object.defineProperty(navigator, 'serviceWorker', {
      value: originalServiceWorker,
      configurable: true,
    })
  })

  test('cleanup on unmount removes event listener', () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')

    mockRegister.mockResolvedValue({ scope: '/test-scope' })

    const { unmount } = render(<ServiceWorkerRegistration />)

    expect(addEventListenerSpy).toHaveBeenCalledWith('load', expect.any(Function))

    const loadCallback = addEventListenerSpy.mock.calls.find((call) => call[0] === 'load')?.[1]

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('load', loadCallback)

    addEventListenerSpy.mockRestore()
    removeEventListenerSpy.mockRestore()
  })
})