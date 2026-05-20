import { render, screen } from '@testing-library/react'
import ReadingProgress from '@/components/ui/ReadingProgress'

const mockRequestAnimationFrame = jest.fn((callback: FrameRequestCallback) => {
  callback(0)
  return 0
})

const mockCancelAnimationFrame = jest.fn()

describe('ReadingProgress Component', () => {
  let addEventListenerSpy: jest.SpyInstance
  let removeEventListenerSpy: jest.SpyInstance

  beforeEach(() => {
    jest.useFakeTimers()
    
    window.requestAnimationFrame = mockRequestAnimationFrame
    window.cancelAnimationFrame = mockCancelAnimationFrame
    
    addEventListenerSpy = jest.spyOn(window, 'addEventListener')
    removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
    
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: 0,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800,
    })
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      writable: true,
      configurable: true,
      value: 2000,
    })
    
    const targetElement = document.createElement('div')
    targetElement.id = 'article-content'
    document.body.appendChild(targetElement)
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
    
    const targetElement = document.getElementById('article-content')
    if (targetElement) {
      document.body.removeChild(targetElement)
    }
  })

  describe('Rendering', () => {
    test('renders null when scroll position is at top (progress <= 0)', () => {
      Object.defineProperty(window, 'scrollY', { value: 0 })
      const { container } = render(<ReadingProgress />)
      jest.runAllTimers()
      expect(container.firstChild).toBeNull()
    })

    test('renders progress bar when there is scroll progress', () => {
      Object.defineProperty(window, 'scrollY', { value: 500 })
      const { container } = render(<ReadingProgress />)
      jest.runAllTimers()
      expect(container.firstChild).not.toBeNull()
    })

    test('renders progress bar with correct structure', () => {
      Object.defineProperty(window, 'scrollY', { value: 500 })
      render(<ReadingProgress />)
      jest.runAllTimers()
      
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()
      expect(progressBar).toHaveClass('fixed', 'top-0', 'left-0', 'right-0', 'z-50', 'h-1', 'bg-transparent')
      
      const progressFill = progressBar.firstChild
      expect(progressFill).toHaveClass('h-full', 'bg-[hsl(var(--color-primary))]', 'transition-all', 'duration-150', 'ease-out')
    })

    test('renders with custom targetId', () => {
      Object.defineProperty(window, 'scrollY', { value: 500 })
      const targetElement = document.createElement('div')
      targetElement.id = 'custom-target'
      document.body.appendChild(targetElement)
      
      render(<ReadingProgress targetId="custom-target" />)
      jest.runAllTimers()
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
      
      document.body.removeChild(targetElement)
    })

    test('uses default targetId when not provided', () => {
      Object.defineProperty(window, 'scrollY', { value: 500 })
      render(<ReadingProgress />)
      jest.runAllTimers()
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })

  describe('Progress Calculation', () => {
    test('calculates 0% progress at top of page', () => {
      Object.defineProperty(window, 'scrollY', { value: 0 })
      const { container } = render(<ReadingProgress />)
      jest.runAllTimers()
      
      expect(container.firstChild).toBeNull()
    })

    test('calculates 50% progress at middle of page', () => {
      Object.defineProperty(window, 'scrollY', { value: 600 })
      render(<ReadingProgress />)
      jest.runAllTimers()
      
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()
      expect(progressBar).toHaveAttribute('aria-valuenow', '50')
    })

    test('calculates 100% progress at bottom of page', () => {
      Object.defineProperty(window, 'scrollY', { value: 1200 })
      render(<ReadingProgress />)
      jest.runAllTimers()
      
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow', '100')
    })

    test('clamps progress between 0 and 100', () => {
      Object.defineProperty(window, 'scrollY', { value: 2000 })
      render(<ReadingProgress />)
      jest.runAllTimers()
      
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow', '100')
    })

    test('handles edge case when documentHeight equals windowHeight', () => {
      Object.defineProperty(window, 'innerHeight', { value: 2000 })
      Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000 })
      Object.defineProperty(window, 'scrollY', { value: 100 })
      
      const { container } = render(<ReadingProgress />)
      jest.runAllTimers()
      
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Accessibility', () => {
    test('has correct role="progressbar"', () => {
      Object.defineProperty(window, 'scrollY', { value: 500 })
      render(<ReadingProgress />)
      jest.runAllTimers()
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    test('has correct aria-valuemin attribute', () => {
      Object.defineProperty(window, 'scrollY', { value: 500 })
      render(<ReadingProgress />)
      jest.runAllTimers()
      
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemin', '0')
    })

    test('has correct aria-valuemax attribute', () => {
      Object.defineProperty(window, 'scrollY', { value: 500 })
      render(<ReadingProgress />)
      jest.runAllTimers()
      
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '100')
    })

    test('has correct aria-valuenow attribute', () => {
      Object.defineProperty(window, 'scrollY', { value: 300 })
      render(<ReadingProgress />)
      jest.runAllTimers()
      
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25')
    })

    test('has correct aria-label in Indonesian', () => {
      Object.defineProperty(window, 'scrollY', { value: 500 })
      render(<ReadingProgress />)
      jest.runAllTimers()
      
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'Kemajuan membaca')
    })
  })

  describe('Event Handling', () => {
    test('registers scroll event listener', () => {
      render(<ReadingProgress />)
      jest.runAllTimers()
      
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        expect.objectContaining({ passive: true })
      )
    })

    test('registers resize event listener', () => {
      render(<ReadingProgress />)
      jest.runAllTimers()
      
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function),
        expect.objectContaining({ passive: true })
      )
    })

    test('uses requestAnimationFrame for scroll handling', () => {
      const rafSpy = jest.spyOn(window, 'requestAnimationFrame')
      Object.defineProperty(window, 'scrollY', { value: 0 })
      
      render(<ReadingProgress />)
      jest.runAllTimers()
      
      Object.defineProperty(window, 'scrollY', { value: 500 })
      
      const scrollHandler = addEventListenerSpy.mock.calls.find(
        call => call[0] === 'scroll'
      )?.[1] as EventListener
      
      if (scrollHandler) {
        scrollHandler(new Event('scroll'))
      }
      
      jest.runAllTimers()
      
      expect(rafSpy).toHaveBeenCalled()
    })
  })

  describe('Cleanup', () => {
    test('removes scroll event listener on unmount', () => {
      Object.defineProperty(window, 'scrollY', { value: 500 })
      
      const { unmount } = render(<ReadingProgress />)
      jest.runAllTimers()
      
      unmount()
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
    })

    test('removes resize event listener on unmount', () => {
      Object.defineProperty(window, 'scrollY', { value: 500 })
      
      const { unmount } = render(<ReadingProgress />)
      jest.runAllTimers()
      
      unmount()
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    })
  })

  describe('Edge Cases', () => {
    test('handles missing target element', () => {
      const targetElement = document.getElementById('article-content')
      if (targetElement) {
        document.body.removeChild(targetElement)
      }
      
      Object.defineProperty(window, 'scrollY', { value: 500 })
      const { container } = render(<ReadingProgress targetId="non-existent" />)
      jest.runAllTimers()
      
      expect(container.firstChild).toBeNull()
    })

    test('renders progress bar with correct width style', () => {
      Object.defineProperty(window, 'scrollY', { value: 600 })
      render(<ReadingProgress />)
      jest.runAllTimers()
      
      const progressBar = screen.getByRole('progressbar')
      const progressFill = progressBar.firstChild as HTMLElement
      expect(progressFill.style.width).toBe('50%')
    })

    test('renders with different targetId values', () => {
      Object.defineProperty(window, 'scrollY', { value: 500 })
      
      const targetElement1 = document.createElement('div')
      targetElement1.id = 'target-1'
      document.body.appendChild(targetElement1)
      
      const { rerender } = render(<ReadingProgress targetId="target-1" />)
      jest.runAllTimers()
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
      
      document.body.removeChild(targetElement1)
      
      const targetElement2 = document.createElement('div')
      targetElement2.id = 'target-2'
      document.body.appendChild(targetElement2)
      
      rerender(<ReadingProgress targetId="target-2" />)
      jest.runAllTimers()
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
      
      document.body.removeChild(targetElement2)
    })
  })
})
