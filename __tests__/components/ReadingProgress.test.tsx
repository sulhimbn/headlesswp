import { render, act } from '@testing-library/react'
import ReadingProgress from '@/components/ui/ReadingProgress'
import React from 'react'

global.requestAnimationFrame = jest.fn((callback) => {
  callback(0)
  return 0
})

global.cancelAnimationFrame = jest.fn()

describe('ReadingProgress', () => {
  const originalInnerHeight = window.innerHeight
  const originalScrollY = window.scrollY
  const originalScrollHeight = document.documentElement.scrollHeight

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.requestAnimationFrame as jest.Mock).mockImplementation((callback) => {
      callback(0)
      return 0
    })
    jest.spyOn(document, 'getElementById').mockImplementation(() => document.createElement('div'))
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true })
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true })
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, writable: true })
  })

  afterEach(() => {
    Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight })
    Object.defineProperty(window, 'scrollY', { value: originalScrollY })
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: originalScrollHeight })
  })

  describe('initial state', () => {
    test('renders null when scroll position is at top (0% progress)', () => {
      Object.defineProperty(window, 'scrollY', { value: 0, writable: true })
      const { container } = render(<ReadingProgress />)
      expect(container.firstChild).toBeNull()
    })

    test('has initial progress state of 0', () => {
      Object.defineProperty(window, 'scrollY', { value: 0, writable: true })
      const { container } = render(<ReadingProgress />)
      const progressbar = container.querySelector('[role="progressbar"]')
      expect(progressbar).toBeNull()
    })
  })

  describe('progress calculation logic', () => {
    test('calculates progress correctly based on scroll position', async () => {
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true })
      Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, writable: true })

      const { container } = render(<ReadingProgress />)

      await act(async () => {
        window.dispatchEvent(new Event('scroll'))
        await new Promise((resolve) => setTimeout(resolve, 100))
      })

      const progressbar = container.querySelector('[role="progressbar"]')
      expect(progressbar).not.toBeNull()
      expect(progressbar).toHaveAttribute('aria-valuenow', '41')
    })

    test('clamps progress to 100% when scrolled past document height', async () => {
      Object.defineProperty(window, 'scrollY', { value: 2000, writable: true })
      Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, writable: true })

      const { container } = render(<ReadingProgress />)

      await act(async () => {
        window.dispatchEvent(new Event('scroll'))
        await new Promise((resolve) => setTimeout(resolve, 100))
      })

      const progressbar = container.querySelector('[role="progressbar"]')
      expect(progressbar).toHaveAttribute('aria-valuenow', '100')
    })

    test('accepts custom targetId prop', async () => {
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true })

      const { container } = render(<ReadingProgress targetId="custom-content" />)

      await act(async () => {
        window.dispatchEvent(new Event('scroll'))
        await new Promise((resolve) => setTimeout(resolve, 100))
      })

      const progressbar = container.querySelector('[role="progressbar"]')
      expect(progressbar).not.toBeNull()
    })
  })

  describe('scroll event handling', () => {
    test('updates progress on scroll event', async () => {
      const { container } = render(<ReadingProgress />)

      Object.defineProperty(window, 'scrollY', { value: 300, writable: true })

      await act(async () => {
        window.dispatchEvent(new Event('scroll'))
        await new Promise((resolve) => setTimeout(resolve, 100))
      })

      const progressbar = container.querySelector('[role="progressbar"]')
      expect(progressbar).not.toBeNull()
    })

    test('updates progress on resize event', async () => {
      Object.defineProperty(window, 'scrollY', { value: 200, writable: true })

      const { container } = render(<ReadingProgress />)

      await act(async () => {
        window.dispatchEvent(new Event('resize'))
        await new Promise((resolve) => setTimeout(resolve, 100))
      })

      const progressbar = container.querySelector('[role="progressbar"]')
      expect(progressbar).not.toBeNull()
    })
  })

  describe('visibility toggle behavior', () => {
    test('hides progress bar when progress is 0', () => {
      Object.defineProperty(window, 'scrollY', { value: 0, writable: true })
      const { container } = render(<ReadingProgress />)
      expect(container.firstChild).toBeNull()
    })

    test('shows progress bar when progress is greater than 0', async () => {
      Object.defineProperty(window, 'scrollY', { value: 100, writable: true })

      const { container } = render(<ReadingProgress />)

      await act(async () => {
        window.dispatchEvent(new Event('scroll'))
        await new Promise((resolve) => setTimeout(resolve, 100))
      })

      const progressbar = container.querySelector('[role="progressbar"]')
      expect(progressbar).not.toBeNull()
    })

    test('has correct ARIA attributes', async () => {
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true })

      const { container } = render(<ReadingProgress />)

      await act(async () => {
        window.dispatchEvent(new Event('scroll'))
        await new Promise((resolve) => setTimeout(resolve, 100))
      })

      const progressbar = container.querySelector('[role="progressbar"]')
      expect(progressbar).toHaveAttribute('aria-valuemin', '0')
      expect(progressbar).toHaveAttribute('aria-valuemax', '100')
      expect(progressbar).toHaveAttribute('aria-label', 'Kemajuan membaca')
    })
  })

  describe('cleanup on unmount', () => {
    test('removes scroll event listener on unmount', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')

      Object.defineProperty(window, 'scrollY', { value: 100, writable: true })

      const { unmount } = render(<ReadingProgress />)

      const scrollCalls = addEventListenerSpy.mock.calls.filter((call) => call[0] === 'scroll')
      expect(scrollCalls.length).toBeGreaterThan(0)

      const scrollCallback = scrollCalls[0][1]
      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', scrollCallback)

      addEventListenerSpy.mockRestore()
      removeEventListenerSpy.mockRestore()
    })

    test('removes resize event listener on unmount', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')

      const { unmount } = render(<ReadingProgress />)

      const resizeCalls = addEventListenerSpy.mock.calls.filter((call) => call[0] === 'resize')
      expect(resizeCalls.length).toBeGreaterThan(0)

      const resizeCallback = resizeCalls[0][1]
      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', resizeCallback)

      addEventListenerSpy.mockRestore()
      removeEventListenerSpy.mockRestore()
    })
  })
})