import { render, screen, act } from '@testing-library/react'
import ReadingProgress from '@/components/ui/ReadingProgress'

describe('ReadingProgress Component', () => {
  const mockElement = {
    getBoundingClientRect: jest.fn(() => ({ top: 0 })),
    scrollHeight: 2000,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    document.getElementById = jest.fn().mockReturnValue(mockElement)
    
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true })
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true })
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2800, writable: true })
    
    window.addEventListener = jest.fn()
    window.removeEventListener = jest.fn()
    window.requestAnimationFrame = jest.fn((callback: FrameRequestCallback) => {
      callback(0)
      return 0
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Rendering', () => {
    test('renders progress bar container when progress > 0', () => {
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true })
      
      render(<ReadingProgress />)
      
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()
    })

    test('returns null when progress is 0', () => {
      Object.defineProperty(window, 'scrollY', { value: 0, writable: true })
      
      render(<ReadingProgress />)
      
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })

    test('has correct aria-label', () => {
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true })
      
      render(<ReadingProgress />)
      
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-label', 'Kemajuan membaca')
    })

    test('has correct aria-valuemin', () => {
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true })
      
      render(<ReadingProgress />)
      
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuemin', '0')
    })

    test('has correct aria-valuemax', () => {
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true })
      
      render(<ReadingProgress />)
      
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuemax', '100')
    })
  })

  describe('Progress Calculation', () => {
    test('calculates correct progress percentage', () => {
      Object.defineProperty(window, 'scrollY', { value: 1000, writable: true })
      
      render(<ReadingProgress />)
      
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow', '50')
    })

    test('caps progress at 100%', () => {
      Object.defineProperty(window, 'scrollY', { value: 3000, writable: true })
      
      render(<ReadingProgress />)
      
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow', '100')
    })

    test('caps progress at 0% when scrolled above top', () => {
      Object.defineProperty(window, 'scrollY', { value: -100, writable: true })
      
      render(<ReadingProgress />)
      
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })

    test('uses custom targetId', () => {
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true })
      document.getElementById = jest.fn().mockReturnValue(mockElement)
      
      render(<ReadingProgress targetId="custom-content" />)
      
      expect(document.getElementById).toHaveBeenCalledWith('custom-content')
    })

    test('uses default targetId when not provided', () => {
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true })
      
      render(<ReadingProgress />)
      
      expect(document.getElementById).toHaveBeenCalledWith('article-content')
    })
  })

  describe('Progress Bar Styling', () => {
    test('container is fixed position', () => {
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true })
      
      render(<ReadingProgress />)
      
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveClass('fixed', 'top-0', 'left-0', 'right-0', 'z-50')
    })

    test('progress bar has correct height', () => {
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true })
      
      render(<ReadingProgress />)
      
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveClass('h-1', 'bg-transparent')
    })

    test('inner bar has primary color', () => {
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true })
      
      render(<ReadingProgress />)
      
      const progressBar = screen.getByRole('progressbar')
      const innerBar = progressBar.firstChild
      expect(innerBar).toHaveClass('bg-[hsl(var(--color-primary))]')
    })

    test('inner bar has transition styling', () => {
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true })
      
      render(<ReadingProgress />)
      
      const progressBar = screen.getByRole('progressbar')
      const innerBar = progressBar.firstChild
      expect(innerBar).toHaveClass('transition-all', 'duration-150', 'ease-out')
    })

    test('sets width based on progress', () => {
      Object.defineProperty(window, 'scrollY', { value: 1000, writable: true })
      
      render(<ReadingProgress />)
      
      const progressBar = screen.getByRole('progressbar')
      const innerBar = progressBar.firstChild as HTMLElement
      expect(innerBar.style.width).toBe('50%')
    })
  })

  describe('Scroll Event Handling', () => {
    test('attaches scroll event listener', () => {
      Object.defineProperty(window, 'scrollY', { value: 0, writable: true })
      
      render(<ReadingProgress />)
      
      expect(window.addEventListener).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        { passive: true }
      )
    })

    test('attaches resize event listener', () => {
      Object.defineProperty(window, 'scrollY', { value: 0, writable: true })
      
      render(<ReadingProgress />)
      
      expect(window.addEventListener).toHaveBeenCalledWith(
        'resize',
        expect.any(Function),
        expect.any(Object)
      )
    })

    test('removes event listeners on unmount', () => {
      Object.defineProperty(window, 'scrollY', { value: 0, writable: true })
      
      const { unmount } = render(<ReadingProgress />)
      unmount()
      
      expect(window.removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function))
      expect(window.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
    })

    test('uses requestAnimationFrame for scroll handling', () => {
      Object.defineProperty(window, 'scrollY', { value: 0, writable: true })
      
      render(<ReadingProgress />)
      
      expect(window.requestAnimationFrame).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    test('handles missing target element', () => {
      document.getElementById = jest.fn().mockReturnValue(null)
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true })
      
      render(<ReadingProgress />)
      
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })

    test('handles zero document height', () => {
      Object.defineProperty(document.documentElement, 'scrollHeight', { value: 800, writable: true })
      Object.defineProperty(window, 'innerHeight', { value: 800, writable: true })
      Object.defineProperty(window, 'scrollY', { value: 0, writable: true })
      
      render(<ReadingProgress />)
      
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })

    test('recalculates on targetId change', async () => {
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true })
      
      const { rerender } = render(<ReadingProgress targetId="old-id" />)
      expect(document.getElementById).toHaveBeenCalledWith('old-id')
      
      rerender(<ReadingProgress targetId="new-id" />)
      expect(document.getElementById).toHaveBeenCalledWith('new-id')
    })
  })

  describe('Memoization', () => {
    test('component is memoized', () => {
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true })
      
      const { rerender } = render(<ReadingProgress />)
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
      
      rerender(<ReadingProgress />)
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })
})
