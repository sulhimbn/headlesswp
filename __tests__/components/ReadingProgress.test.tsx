import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ReadingProgress from '@/components/ui/ReadingProgress'

describe('ReadingProgress Component', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const setupMocks = (scrollY = 0, documentHeight = 2000, windowHeight = 800) => {
    Object.defineProperty(window, 'scrollY', {
      value: scrollY,
      writable: true,
      configurable: true
    })

    Object.defineProperty(window, 'innerHeight', {
      value: windowHeight,
      writable: true,
      configurable: true
    })

    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: documentHeight,
      writable: true,
      configurable: true
    })

    const mockElement = {
      getBoundingClientRect: jest.fn(() => ({ top: 0 }))
    }
    document.getElementById = jest.fn().mockReturnValue(mockElement)
  }

  describe('Rendering', () => {
    test('renders progress bar when there is scroll progress', () => {
      setupMocks(500, 2000, 800)
      render(<ReadingProgress />)
      
      jest.advanceTimersByTime(100)

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    test('renders progress bar with correct position styles', () => {
      setupMocks(500, 2000, 800)
      render(<ReadingProgress />)
      
      jest.advanceTimersByTime(100)

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveClass('fixed')
      expect(progressBar).toHaveClass('top-0')
      expect(progressBar).toHaveClass('left-0')
      expect(progressBar).toHaveClass('right-0')
      expect(progressBar).toHaveClass('z-50')
      expect(progressBar).toHaveClass('h-1')
      expect(progressBar).toHaveClass('bg-transparent')
    })

    test('renders progress indicator with primary color', () => {
      setupMocks(500, 2000, 800)
      render(<ReadingProgress />)
      
      jest.advanceTimersByTime(100)

      const indicator = document.querySelector('.bg-\\[hsl\\(var\\(--color-primary\\)\\)\\]')
      expect(indicator).toBeInTheDocument()
    })

    test('renders with default targetId', () => {
      setupMocks(500, 2000, 800)
      render(<ReadingProgress />)
      
      jest.advanceTimersByTime(100)

      expect(document.getElementById).toHaveBeenCalledWith('article-content')
    })

    test('renders with custom targetId', () => {
      setupMocks(500, 2000, 800)
      render(<ReadingProgress targetId="custom-content" />)
      
      jest.advanceTimersByTime(100)

      expect(document.getElementById).toHaveBeenCalledWith('custom-content')
    })

    test('progress indicator has transition styles', () => {
      setupMocks(500, 2000, 800)
      render(<ReadingProgress />)
      
      jest.advanceTimersByTime(100)

      const indicator = document.querySelector('.bg-\\[hsl\\(var\\(--color-primary\\)\\)\\]')
      expect(indicator).toHaveClass('transition-all')
      expect(indicator).toHaveClass('duration-150')
      expect(indicator).toHaveClass('ease-out')
    })
  })

  describe('Progress Calculation', () => {
    test('calculates correct progress percentage', () => {
      setupMocks(500, 2000, 800)
      render(<ReadingProgress />)
      
      jest.advanceTimersByTime(100)

      const indicator = document.querySelector('.bg-\\[hsl\\(var\\(--color-primary\\)\\)\\]') as HTMLElement
      const width = indicator?.style?.width
      expect(parseFloat(width || '0')).toBeCloseTo(41.67, 1)
    })

    test('clamps progress to 100% at bottom', () => {
      setupMocks(2000, 2000, 800)
      render(<ReadingProgress />)
      
      jest.advanceTimersByTime(100)

      const indicator = document.querySelector('.bg-\\[hsl\\(var\\(--color-primary\\)\\)\\]') as HTMLElement
      const width = indicator?.style?.width
      expect(parseFloat(width || '0')).toBeLessThanOrEqual(100)
    })

    test('clamps progress to 0% at top', () => {
      setupMocks(0, 2000, 800)
      render(<ReadingProgress />)
      
      jest.advanceTimersByTime(100)

      const indicator = document.querySelector('.bg-\\[hsl\\(var\\(--color-primary\\)\\)\\]') as HTMLElement
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })

    test('handles zero document height', () => {
      setupMocks(0, 800, 800)
      render(<ReadingProgress />)
      
      jest.advanceTimersByTime(100)

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    test('progressbar has aria-valuenow attribute', () => {
      setupMocks(500, 2000, 800)
      render(<ReadingProgress />)
      
      jest.advanceTimersByTime(100)

      const progressBar = screen.getByRole('progressbar')
      const value = Math.round((500 / (2000 - 800)) * 100)
      expect(progressBar).toHaveAttribute('aria-valuenow', String(value))
    })

    test('progressbar has aria-valuemin attribute', () => {
      setupMocks(500, 2000, 800)
      render(<ReadingProgress />)
      
      jest.advanceTimersByTime(100)

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuemin', '0')
    })

    test('progressbar has aria-valuemax attribute', () => {
      setupMocks(500, 2000, 800)
      render(<ReadingProgress />)
      
      jest.advanceTimersByTime(100)

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuemax', '100')
    })

    test('progressbar has aria-label in Indonesian', () => {
      setupMocks(500, 2000, 800)
      render(<ReadingProgress />)
      
      jest.advanceTimersByTime(100)

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-label', 'Kemajuan membaca')
    })
  })

  describe('Scroll Event Handling', () => {
    test('updates progress on resize event', () => {
      setupMocks(500, 2000, 800)
      render(<ReadingProgress />)
      
      jest.advanceTimersByTime(100)

      const resizeEvent = new Event('resize')
      window.dispatchEvent(resizeEvent)
      jest.advanceTimersByTime(100)

      expect(document.getElementById).toHaveBeenCalled()
    })
  })

  describe('Cleanup', () => {
    test('removes scroll listener on unmount', () => {
      setupMocks(0, 2000, 800)
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
      const { unmount } = render(<ReadingProgress />)
      
      jest.advanceTimersByTime(100)

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
    })

    test('removes resize listener on unmount', () => {
      setupMocks(0, 2000, 800)
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
      const { unmount } = render(<ReadingProgress />)
      
      jest.advanceTimersByTime(100)

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    })
  })

  describe('Design Tokens', () => {
    test('uses design tokens for primary color', () => {
      setupMocks(500, 2000, 800)
      render(<ReadingProgress />)
      
      jest.advanceTimersByTime(100)

      const indicator = document.querySelector('.bg-\\[hsl\\(var\\(--color-primary\\)\\)\\]')
      expect(indicator).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    test('handles missing target element', () => {
      setupMocks(500, 2000, 800)
      document.getElementById = jest.fn().mockReturnValue(null)

      render(<ReadingProgress />)
      
      jest.advanceTimersByTime(100)

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })

    test('handles negative scroll position', () => {
      setupMocks(-100, 2000, 800)
      render(<ReadingProgress />)
      
      jest.advanceTimersByTime(100)

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })

    test('handles very long document', () => {
      setupMocks(5000, 10000, 800)
      render(<ReadingProgress />)
      
      jest.advanceTimersByTime(100)

      const progressBar = screen.getByRole('progressbar')
      const indicator = progressBar.querySelector('div')
      expect(indicator).toBeInTheDocument()
    })
  })
})
