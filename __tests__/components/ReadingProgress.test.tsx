import { render, screen, fireEvent } from '@testing-library/react'
import ReadingProgress from '@/components/ui/ReadingProgress'

describe('ReadingProgress Component', () => {
  let mockScrollY = 0
  let mockInnerHeight = 800
  let mockScrollHeight = 1000

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockScrollY = 0
    mockInnerHeight = 800
    mockScrollHeight = 1000
    
    Object.defineProperty(window, 'scrollY', {
      get: () => mockScrollY,
      set: (val) => { mockScrollY = val },
      configurable: true,
    })
    Object.defineProperty(window, 'pageYOffset', {
      get: () => mockScrollY,
      set: (val) => { mockScrollY = val },
      configurable: true,
    })
    Object.defineProperty(window, 'innerHeight', {
      get: () => mockInnerHeight,
      set: (val) => { mockInnerHeight = val },
      configurable: true,
    })
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      get: () => mockScrollHeight,
      set: (val) => { mockScrollHeight = val },
      configurable: true,
    })
    Object.defineProperty(document.documentElement, 'clientHeight', {
      get: () => 800,
      configurable: true,
    })
    Object.defineProperty(window, 'requestAnimationFrame', {
      value: jest.fn((cb) => { cb(); return 1 }),
      writable: true,
    })
    
    const mockElement = document.createElement('div')
    mockElement.id = 'article-content'
    document.body.appendChild(mockElement)
  })

  afterEach(() => {
    const element = document.getElementById('article-content')
    if (element) {
      document.body.removeChild(element)
    }
  })

  describe('Rendering', () => {
    test('renders progress bar when there is scroll progress', () => {
      mockScrollY = 200
      
      render(<ReadingProgress />)
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    test('renders with custom targetId', () => {
      const customElement = document.createElement('div')
      customElement.id = 'custom-content'
      document.body.appendChild(customElement)
      
      mockScrollY = 200
      
      render(<ReadingProgress targetId="custom-content" />)
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
      
      document.body.removeChild(customElement)
    })

    test('does not render when progress is 0', () => {
      mockScrollY = 0
      
      const { container } = render(<ReadingProgress />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Progress Calculation', () => {
    test('calculates progress at middle of page', () => {
      mockScrollY = 100
      
      render(<ReadingProgress />)
      
      const progressbar = screen.getByRole('progressbar')
      const progressValue = parseInt(progressbar.getAttribute('aria-valuenow') || '0', 10)
      expect(progressValue).toBeGreaterThan(0)
    })

    test('calculates progress at bottom of page', () => {
      mockScrollY = 200
      
      render(<ReadingProgress />)
      
      const progressbar = screen.getByRole('progressbar')
      const progressValue = parseInt(progressbar.getAttribute('aria-valuenow') || '0', 10)
      expect(progressValue).toBe(100)
    })

    test('caps progress at 100% when exceeding document height', () => {
      mockScrollY = 500
      
      render(<ReadingProgress />)
      
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-valuenow', '100')
    })
  })

  describe('Scroll Detection', () => {
    test('updates progress on scroll event', () => {
      render(<ReadingProgress />)
      
      mockScrollY = 100
      fireEvent.scroll(window)
      
      const progressbar = screen.getByRole('progressbar')
      const progressValue = parseInt(progressbar.getAttribute('aria-valuenow') || '0', 10)
      expect(progressValue).toBeGreaterThan(0)
    })

    test('updates progress on resize event', () => {
      render(<ReadingProgress />)
      
      mockInnerHeight = 600
      mockScrollY = 100
      fireEvent.resize(window)
      
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toBeInTheDocument()
    })

    test('uses requestAnimationFrame for scroll handling', () => {
      const requestAnimationFrameMock = jest.fn((cb) => { cb(); return 1 })
      Object.defineProperty(window, 'requestAnimationFrame', {
        value: requestAnimationFrameMock,
        writable: true,
      })
      
      render(<ReadingProgress />)
      
      mockScrollY = 100
      fireEvent.scroll(window)
      
      expect(requestAnimationFrameMock).toHaveBeenCalled()
    })
  })

  describe('Event Listener Cleanup', () => {
    test('removes scroll listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
      
      const { unmount } = render(<ReadingProgress />)
      
      unmount()
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
    })

    test('removes resize listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
      
      const { unmount } = render(<ReadingProgress />)
      
      unmount()
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    })
  })

  describe('Accessibility', () => {
    test('has progressbar role', () => {
      mockScrollY = 200
      
      render(<ReadingProgress />)
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    test('has aria-valuemin attribute set to 0', () => {
      mockScrollY = 200
      
      render(<ReadingProgress />)
      
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemin', '0')
    })

    test('has aria-valuemax attribute set to 100', () => {
      mockScrollY = 200
      
      render(<ReadingProgress />)
      
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '100')
    })

    test('has aria-valuenow reflecting current progress', () => {
      mockScrollY = 100
      
      render(<ReadingProgress />)
      
      const progressbar = screen.getByRole('progressbar')
      const value = parseInt(progressbar.getAttribute('aria-valuenow') || '0', 10)
      expect(value).toBeGreaterThan(0)
    })

    test('has aria-label in Indonesian', () => {
      mockScrollY = 200
      
      render(<ReadingProgress />)
      
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'Kemajuan membaca')
    })
  })

  describe('Visual Rendering', () => {
    test('renders progress bar element', () => {
      mockScrollY = 100
      
      render(<ReadingProgress />)
      
      const progressBar = document.querySelector('.bg-\\[hsl\\(var\\(--color-primary\\)\\)\\]')
      expect(progressBar).toBeInTheDocument()
    })

    test('applies fixed positioning', () => {
      mockScrollY = 200
      
      render(<ReadingProgress />)
      
      const container = screen.getByRole('progressbar')
      expect(container).toHaveClass('fixed')
      expect(container).toHaveClass('top-0')
      expect(container).toHaveClass('left-0')
      expect(container).toHaveClass('right-0')
    })

    test('applies z-index for overlay', () => {
      mockScrollY = 200
      
      render(<ReadingProgress />)
      
      const container = screen.getByRole('progressbar')
      expect(container).toHaveClass('z-50')
    })

    test('has transition effect on width changes', () => {
      mockScrollY = 200
      
      render(<ReadingProgress />)
      
      const progressBar = document.querySelector('.transition-all')
      expect(progressBar).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    test('handles missing target element', () => {
      const targetElement = document.getElementById('article-content')
      if (targetElement) {
        document.body.removeChild(targetElement)
      }
      
      mockScrollY = 200
      
      const { container } = render(<ReadingProgress />)
      expect(container.firstChild).toBeNull()
    })

    test('component handles negative scroll position gracefully', () => {
      mockScrollY = -50
      
      const { container } = render(<ReadingProgress />)
      expect(container.firstChild).toBeNull()
    })

    test('component handles memoization correctly', () => {
      mockScrollY = 100
      
      const { rerender } = render(<ReadingProgress />)
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
      
      rerender(<ReadingProgress />)
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })
})
