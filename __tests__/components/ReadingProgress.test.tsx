import { render, screen } from '@testing-library/react'
import ReadingProgress from '@/components/ui/ReadingProgress'

describe('ReadingProgress Component', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    
    window.addEventListener = jest.fn()
    window.removeEventListener = jest.fn()
    window.requestAnimationFrame = jest.fn((cb) => {
      cb(0)
      return 0
    })
    
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true })
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 1800, writable: true })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Progress bar renders', () => {
    test('does not render when scroll position is at top', () => {
      Object.defineProperty(window, 'scrollY', { value: 0, writable: true })
      
      const { container } = render(<ReadingProgress />)
      
      jest.runAllTimers()
      
      expect(container.firstChild).not.toBeInTheDocument()
    })
  })

  describe('Progress updates on scroll', () => {
    test('registers scroll event listener on mount', () => {
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true })
      
      render(<ReadingProgress />)
      
      expect(window.addEventListener).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        { passive: true }
      )
    })

    test('registers resize event listener on mount', () => {
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true })
      
      render(<ReadingProgress />)
      
      expect(window.addEventListener).toHaveBeenCalledWith(
        'resize',
        expect.any(Function),
        { passive: true }
      )
    })
  })

  describe('Cleanup on unmount', () => {
    test('removes event listeners on unmount', () => {
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true })
      
      const { unmount } = render(<ReadingProgress />)
      
      expect(window.addEventListener).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        { passive: true }
      )
      
      unmount()
      
      expect(window.removeEventListener).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function)
      )
      expect(window.removeEventListener).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      )
    })
  })

  describe('Component behavior', () => {
    test('renders with default targetId', () => {
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true })
      
      const { container } = render(<ReadingProgress />)
      
      jest.runAllTimers()
      
      expect(container.firstChild).not.toBeInTheDocument()
    })

    test('handles missing target element gracefully', () => {
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true })
      
      const { container } = render(<ReadingProgress targetId="non-existent" />)
      
      jest.runAllTimers()
      
      expect(container.firstChild).not.toBeInTheDocument()
    })
  })
})
