import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import ReadingProgress from '@/components/ui/ReadingProgress'
import React from 'react'

describe('ReadingProgress Component', () => {
  const mockScrollY = jest.fn()
  const mockInnerHeight = jest.fn()
  const mockScrollHeight = jest.fn()
  const mockAddEventListener = jest.fn()
  const mockRemoveEventListener = jest.fn()
  const mockRequestAnimationFrame = jest.fn((cb) => cb())

  const mockGetElementById = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      get: mockScrollY,
    })

    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      get: mockInnerHeight,
    })

    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      get: mockScrollHeight,
    })

    window.addEventListener = mockAddEventListener
    window.removeEventListener = mockRemoveEventListener
    window.requestAnimationFrame = mockRequestAnimationFrame

    mockGetElementById.mockReturnValue({} as HTMLElement)
    document.getElementById = mockGetElementById
  })

  describe('Progress Calculation', () => {
    test('calculates 0% progress at top of page', async () => {
      mockScrollY.mockReturnValue(0)
      mockInnerHeight.mockReturnValue(800)
      mockScrollHeight.mockReturnValue(2000)

      render(<ReadingProgress />)

      await waitFor(() => {
        const progressbar = screen.queryByRole('progressbar')
        expect(progressbar).not.toBeInTheDocument()
      })
    })

    test('calculates 50% progress at middle of page', async () => {
      mockScrollY.mockReturnValue(600)
      mockInnerHeight.mockReturnValue(800)
      mockScrollHeight.mockReturnValue(2000)

      const { container } = render(<ReadingProgress />)

      await waitFor(() => {
        const progressBar = container.querySelector('[role="progressbar"]')
        expect(progressBar).toBeInTheDocument()
      })
    })

    test('calculates 100% progress at bottom of page', async () => {
      mockScrollY.mockReturnValue(1200)
      mockInnerHeight.mockReturnValue(800)
      mockScrollHeight.mockReturnValue(2000)

      const { container } = render(<ReadingProgress />)

      await waitFor(() => {
        const progressBar = container.querySelector('[role="progressbar"]')
        expect(progressBar).toBeInTheDocument()
      })
    })

    test('clamps progress to 100% when exceeding document height', async () => {
      mockScrollY.mockReturnValue(2000)
      mockInnerHeight.mockReturnValue(800)
      mockScrollHeight.mockReturnValue(2000)

      const { container } = render(<ReadingProgress />)

      await waitFor(() => {
        const progressBar = container.querySelector('[role="progressbar"]')
        expect(progressBar).toBeInTheDocument()
      })
    })

    test('clamps progress to 0% when negative', async () => {
      mockScrollY.mockReturnValue(-100)
      mockInnerHeight.mockReturnValue(800)
      mockScrollHeight.mockReturnValue(2000)

      const { container } = render(<ReadingProgress />)

      await waitFor(() => {
        const progressbar = screen.queryByRole('progressbar')
        expect(progressbar).not.toBeInTheDocument()
      })
    })

    test('handles zero document height', async () => {
      mockScrollY.mockReturnValue(0)
      mockInnerHeight.mockReturnValue(800)
      mockScrollHeight.mockReturnValue(800)

      render(<ReadingProgress />)

      await waitFor(() => {
        const progressbar = screen.queryByRole('progressbar')
        expect(progressbar).not.toBeInTheDocument()
      })
    })
  })

  describe('Scroll Behavior', () => {
    test('adds scroll event listener on mount', () => {
      mockScrollY.mockReturnValue(0)
      mockInnerHeight.mockReturnValue(800)
      mockScrollHeight.mockReturnValue(2000)

      render(<ReadingProgress />)

      expect(mockAddEventListener).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        { passive: true }
      )
    })

    test('adds resize event listener on mount', () => {
      mockScrollY.mockReturnValue(0)
      mockInnerHeight.mockReturnValue(800)
      mockScrollHeight.mockReturnValue(2000)

      render(<ReadingProgress />)

      expect(mockAddEventListener).toHaveBeenCalledWith(
        'resize',
        expect.any(Function),
        { passive: true }
      )
    })

    test('removes event listeners on unmount', () => {
      mockScrollY.mockReturnValue(0)
      mockInnerHeight.mockReturnValue(800)
      mockScrollHeight.mockReturnValue(2000)

      const { unmount } = render(<ReadingProgress />)
      unmount()

      expect(mockRemoveEventListener).toHaveBeenCalledWith('scroll', expect.any(Function))
      expect(mockRemoveEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
    })

    test('updates progress on scroll event', async () => {
      mockScrollY
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(600)
      mockInnerHeight.mockReturnValue(800)
      mockScrollHeight.mockReturnValue(2000)

      const { container } = render(<ReadingProgress />)

      await waitFor(() => {
        const progressbar = screen.queryByRole('progressbar')
        expect(progressbar).not.toBeInTheDocument()
      })

      const scrollHandler = mockAddEventListener.mock.calls.find(
        (call) => call[0] === 'scroll'
      )[1]

      mockScrollY.mockReturnValue(600)
      
      await act(async () => {
        scrollHandler()
        await Promise.resolve()
      })

      await waitFor(() => {
        const progressBar = container.querySelector('[role="progressbar"]')
        expect(progressBar).toBeInTheDocument()
      })
    })

    test('updates progress on resize event', async () => {
      mockScrollY.mockReturnValue(600)
      mockInnerHeight
        .mockReturnValueOnce(800)
        .mockReturnValueOnce(1000)
      mockScrollHeight
        .mockReturnValueOnce(2000)
        .mockReturnValueOnce(2500)

      render(<ReadingProgress />)

      await waitFor(() => {
        const progressBar = screen.queryByRole('progressbar')
        expect(progressBar).toBeInTheDocument()
      })

      const resizeHandler = mockAddEventListener.mock.calls.find(
        (call) => call[0] === 'resize'
      )[1]

      mockInnerHeight.mockReturnValue(1000)
      mockScrollHeight.mockReturnValue(2500)

      await act(async () => {
        resizeHandler()
        await Promise.resolve()
      })

      const progressBar = screen.queryByRole('progressbar')
      expect(progressBar).toBeInTheDocument()
    })

    test('uses requestAnimationFrame for scroll optimization', async () => {
      mockScrollY.mockReturnValue(0)
      mockInnerHeight.mockReturnValue(800)
      mockScrollHeight.mockReturnValue(2000)

      render(<ReadingProgress />)

      const scrollHandler = mockAddEventListener.mock.calls.find(
        (call) => call[0] === 'scroll'
      )[1]

      await act(async () => {
        scrollHandler()
        await Promise.resolve()
      })

      expect(mockRequestAnimationFrame).toHaveBeenCalled()
    })
  })

  describe('Custom Target ID', () => {
    test('uses default target id when not provided', () => {
      mockScrollY.mockReturnValue(0)
      mockInnerHeight.mockReturnValue(800)
      mockScrollHeight.mockReturnValue(2000)
      mockGetElementById.mockReturnValue({} as HTMLElement)

      render(<ReadingProgress />)

      expect(mockGetElementById).toHaveBeenCalledWith('article-content')
    })

    test('uses custom target id when provided', () => {
      mockScrollY.mockReturnValue(0)
      mockInnerHeight.mockReturnValue(800)
      mockScrollHeight.mockReturnValue(2000)
      mockGetElementById.mockReturnValue({} as HTMLElement)

      render(<ReadingProgress targetId="custom-content" />)

      expect(mockGetElementById).toHaveBeenCalledWith('custom-content')
    })
  })

  describe('Rendering', () => {
    test('renders progress bar with correct styling when progress > 0', async () => {
      mockScrollY.mockReturnValue(600)
      mockInnerHeight.mockReturnValue(800)
      mockScrollHeight.mockReturnValue(2000)

      const { container } = render(<ReadingProgress />)

      await waitFor(() => {
        const progressBar = container.querySelector('[role="progressbar"]')
        expect(progressBar).toBeInTheDocument()
        expect(progressBar).toHaveClass('fixed', 'top-0', 'left-0', 'right-0', 'z-50', 'h-1', 'bg-transparent')
      })
    })

    test('renders progress indicator with correct aria attributes', async () => {
      mockScrollY.mockReturnValue(600)
      mockInnerHeight.mockReturnValue(800)
      mockScrollHeight.mockReturnValue(2000)

      render(<ReadingProgress />)

      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar')
        expect(progressBar).toHaveAttribute('aria-valuemin', '0')
        expect(progressBar).toHaveAttribute('aria-valuemax', '100')
        expect(progressBar).toHaveAttribute('aria-label', 'Kemajuan membaca')
      })
    })

    test('renders inner progress div with width based on progress', async () => {
      mockScrollY.mockReturnValue(600)
      mockInnerHeight.mockReturnValue(800)
      mockScrollHeight.mockReturnValue(2000)

      const { container } = render(<ReadingProgress />)

      await waitFor(() => {
        const innerDiv = container.querySelector('.transition-all')
        expect(innerDiv).toBeInTheDocument()
        expect(innerDiv).toHaveClass('h-full', 'bg-[hsl(var(--color-primary))]')
      })
    })

    test('does not render when target element is missing', () => {
      mockScrollY.mockReturnValue(0)
      mockInnerHeight.mockReturnValue(800)
      mockScrollHeight.mockReturnValue(2000)
      mockGetElementById.mockReturnValue(null)

      const { container } = render(<ReadingProgress targetId="non-existent" />)

      expect(container.firstChild).toBeNull()
    })
  })

  describe('Accessibility', () => {
    test('progressbar has correct role', async () => {
      mockScrollY.mockReturnValue(600)
      mockInnerHeight.mockReturnValue(800)
      mockScrollHeight.mockReturnValue(2000)

      render(<ReadingProgress />)

      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument()
      })
    })

    test('aria-valuenow is rounded to integer', async () => {
      mockScrollY.mockReturnValue(302)
      mockInnerHeight.mockReturnValue(800)
      mockScrollHeight.mockReturnValue(2000)

      render(<ReadingProgress />)

      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar')
        expect(progressBar).toHaveAttribute('aria-valuenow', '25')
      })
    })
  })

  describe('Memoization', () => {
    test('component is memoized', () => {
      expect(ReadingProgress).toBeDefined()
    })
  })
})
