import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import ReadingProgress from '@/components/ui/ReadingProgress'
import React from 'react'

let mockGetElementById: jest.Mock

describe('ReadingProgress Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetElementById = jest.fn()
    document.getElementById = mockGetElementById
    window.scrollY = 0
    window.innerHeight = 768
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 2000,
      configurable: true,
    })
  })

  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    test('renders progress bar when there is scroll progress', () => {
      window.scrollY = 500
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 2000,
        configurable: true,
      })

      mockGetElementById.mockReturnValue(true)

      render(<ReadingProgress />)

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    test('renders null when progress is 0', () => {
      window.scrollY = 0
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 2000,
        configurable: true,
      })

      mockGetElementById.mockReturnValue(true)

      const { container } = render(<ReadingProgress />)
      expect(container.firstChild).toBeNull()
    })

    test('renders progress bar with correct aria attributes', () => {
      window.scrollY = 500
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 2000,
        configurable: true,
      })

      mockGetElementById.mockReturnValue(true)

      render(<ReadingProgress />)

      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-valuemin', '0')
      expect(progressbar).toHaveAttribute('aria-valuemax', '100')
      expect(progressbar).toHaveAttribute('aria-label', 'Kemajuan membaca')
    })
  })

  describe('Progress calculation', () => {
    test('calculates correct progress percentage', () => {
      window.scrollY = 600
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 2000,
        configurable: true,
      })

      mockGetElementById.mockReturnValue(true)

      render(<ReadingProgress />)

      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-valuenow', '49')
    })

    test('clamps progress to 100 when scrolled beyond document', () => {
      window.scrollY = 2000
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 1500,
        configurable: true,
      })

      mockGetElementById.mockReturnValue(true)

      render(<ReadingProgress />)

      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-valuenow', '100')
    })
  })

  describe('Event handling', () => {
    test('updates progress on scroll', () => {
      jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
        cb(0)
        return 0
      })

      window.scrollY = 0
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 2000,
        configurable: true,
      })

      mockGetElementById.mockReturnValue(true)

      const { rerender } = render(<ReadingProgress />)

      expect(screen.queryByRole('progressbar')).toBeNull()

      window.scrollY = 500
      fireEvent.scroll(window)

      rerender(<ReadingProgress />)

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    test('listens to resize event', () => {
      window.scrollY = 500
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 2000,
        configurable: true,
      })

      mockGetElementById.mockReturnValue(true)

      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
      render(<ReadingProgress />)

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function),
        { passive: true }
      )
    })
  })

  describe('Cleanup', () => {
    test('removes event listeners on unmount', () => {
      window.scrollY = 500
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 2000,
        configurable: true,
      })

      mockGetElementById.mockReturnValue(true)

      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
      const { unmount } = render(<ReadingProgress />)

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function)
      )
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      )
    })
  })

  describe('Custom targetId', () => {
    test('uses custom targetId to find element', () => {
      window.scrollY = 500
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 2000,
        configurable: true,
      })

      mockGetElementById.mockReturnValue(true)

      render(<ReadingProgress targetId="custom-content" />)

      expect(document.getElementById).toHaveBeenCalledWith('custom-content')
    })

    test('renders null when target element does not exist', () => {
      window.scrollY = 500
      mockGetElementById.mockReturnValue(null)

      const { container } = render(<ReadingProgress targetId="non-existent" />)

      expect(container.firstChild).toBeNull()
    })
  })
})
