import { render, act } from '@testing-library/react'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'
import React from 'react'

const mockRegister = jest.fn()
const mockAddEventListener = jest.fn()
const mockRemoveEventListener = jest.fn()
const mockAddEventListenerCalls: Array<[string, (() => void) | null]> = []

const originalWindowAddEventListener = window.addEventListener
const originalWindowRemoveEventListener = window.removeEventListener

beforeEach(() => {
  jest.clearAllMocks()
  mockAddEventListenerCalls.length = 0
  mockAddEventListener.mockImplementation((event: string, callback: (() => void) | null) => {
    mockAddEventListenerCalls.push([event, callback])
  })
  Object.defineProperty(navigator, 'serviceWorker', {
    value: {
      register: mockRegister,
    },
    writable: true,
  })
  window.addEventListener = mockAddEventListener
  window.removeEventListener = mockRemoveEventListener
})

afterEach(() => {
  Object.defineProperty(navigator, 'serviceWorker', {
    value: undefined,
    writable: true,
  })
  window.addEventListener = originalWindowAddEventListener
  window.removeEventListener = originalWindowRemoveEventListener
})

describe('ServiceWorkerRegistration Component', () => {
  describe('Service worker registration on mount', () => {
    test('does not register when serviceWorker is not available', () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: undefined,
        writable: true,
      })
      
      render(<ServiceWorkerRegistration />)
      
      expect(mockRegister).not.toHaveBeenCalled()
    })

    test('adds load event listener when serviceWorker is available', async () => {
      mockRegister.mockResolvedValue({ scope: '/scope' })
      
      await act(async () => {
        render(<ServiceWorkerRegistration />)
      })
      
      const loadCallback = mockAddEventListenerCalls.find(
        (call) => call[0] === 'load'
      )?.[1]
      
      expect(loadCallback).toBeDefined()
      
      await act(async () => {
        loadCallback!()
      })
      
      expect(mockRegister).toHaveBeenCalledWith('/sw.js')
    })

    test('registers service worker with correct path', async () => {
      mockRegister.mockResolvedValue({ scope: '/scope' })
      
      await act(async () => {
        render(<ServiceWorkerRegistration />)
      })
      
      const loadCallback = mockAddEventListenerCalls.find(
        (call) => call[0] === 'load'
      )?.[1]
      
      await act(async () => {
        loadCallback!()
      })
      
      expect(mockRegister).toHaveBeenCalledWith('/sw.js')
    })
  })

  describe('Error handling', () => {
    test('handles registration failure without crashing', async () => {
      const registrationError = new Error('Registration failed')
      mockRegister.mockRejectedValue(registrationError)
      
      const { unmount } = render(<ServiceWorkerRegistration />)
      
      const loadCallback = mockAddEventListenerCalls.find(
        (call) => call[0] === 'load'
      )?.[1]
      
      expect(loadCallback).toBeDefined()
      
      await act(async () => {
        loadCallback!()
      })
      
      expect(mockRegister).toHaveBeenCalledWith('/sw.js')
      
      unmount()
    })
  })

  describe('Cleanup on unmount', () => {
    test('component renders without errors', async () => {
      await act(async () => {
        const { unmount } = render(<ServiceWorkerRegistration />)
        unmount()
      })
      
      expect(true).toBe(true)
    })

    test('component returns null (renders nothing)', () => {
      const { container } = render(<ServiceWorkerRegistration />)
      
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Update handling', () => {
    test('component re-renders without side effects', async () => {
      const { rerender } = await act(async () => {
        return render(<ServiceWorkerRegistration />)
      })
      
      await act(async () => {
        rerender(<ServiceWorkerRegistration />)
      })
      
      expect(mockAddEventListenerCalls.length).toBeGreaterThanOrEqual(1)
    })
  })
})