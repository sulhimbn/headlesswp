import { render, screen, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import ReadingProgress from '@/components/ui/ReadingProgress'

describe('ReadingProgress', () => {
  let originalInnerHeight: number
  let originalScrollHeight: number
  let originalScrollY: number

  beforeEach(() => {
    jest.clearAllMocks()
    
    originalInnerHeight = window.innerHeight
    originalScrollHeight = document.documentElement.scrollHeight
    originalScrollY = window.scrollY
    
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
    
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: 0,
    })
    
    window.scrollTo = jest.fn()
    window.addEventListener = jest.fn()
    window.removeEventListener = jest.fn()
    window.requestAnimationFrame = jest.fn() as unknown as (callback: FrameRequestCallback) => number
    document.getElementById = jest.fn().mockReturnValue({
      getBoundingClientRect: () => ({ top: 100 })
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    })
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      writable: true,
      configurable: true,
      value: originalScrollHeight,
    })
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: originalScrollY,
    })
  })

  describe('Rendering', () => {
    it('should not render when progress is 0', () => {
      Object.defineProperty(window, 'scrollY', {
        writable: true,
        configurable: true,
        value: 0,
      })
      
      const { container } = render(<ReadingProgress />)
      
      expect(container.firstChild).toBeNull()
    })

    it('should render progress bar when scrolling', async () => {
      Object.defineProperty(window, 'scrollY', {
        writable: true,
        configurable: true,
        value: 500,
      })
      
      const { container } = render(<ReadingProgress />)
      
      await act(async () => {})
      
      expect(container.firstChild).not.toBeNull()
    })

    it('should have correct accessibility attributes', async () => {
      Object.defineProperty(window, 'scrollY', {
        writable: true,
        configurable: true,
        value: 500,
      })
      
      render(<ReadingProgress />)
      
      await act(async () => {})
      
      const progressBar = document.querySelector('[role="progressbar"]')
      expect(progressBar).toHaveAttribute('aria-valuemin', '0')
      expect(progressBar).toHaveAttribute('aria-valuemax', '100')
      expect(progressBar).toHaveAttribute('aria-label', 'Kemajuan membaca')
    })
  })

  describe('Scroll calculation', () => {
    it('should calculate progress correctly', async () => {
      Object.defineProperty(window, 'scrollY', {
        writable: true,
        configurable: true,
        value: 600,
      })
      
      render(<ReadingProgress />)
      
      await act(async () => {})
      
      const progressBar = document.querySelector('[role="progressbar"]')
      const valuenow = parseInt(progressBar?.getAttribute('aria-valuenow') || '0', 10)
      expect(valuenow).toBeGreaterThan(0)
    })

    it('should cap progress at 100%', async () => {
      Object.defineProperty(window, 'scrollY', {
        writable: true,
        configurable: true,
        value: 2000,
      })
      
      render(<ReadingProgress />)
      
      await act(async () => {})
      
      const progressBar = document.querySelector('[role="progressbar"]')
      const valuenow = parseInt(progressBar?.getAttribute('aria-valuenow') || '0', 10)
      expect(valuenow).toBeLessThanOrEqual(100)
    })

    it('should use custom targetId', () => {
      const mockGetElementById = jest.fn().mockReturnValue(null)
      global.document.getElementById = mockGetElementById

      render(<ReadingProgress targetId="custom-article" />)
      
      expect(mockGetElementById).toHaveBeenCalledWith('custom-article')
    })
  })

  describe('Cleanup', () => {
    it('should remove scroll listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
      
      const { unmount } = render(<ReadingProgress />)
      
      unmount()
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    })

    it('should add scroll and resize listeners on mount', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
      
      render(<ReadingProgress />)
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true })
      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function), { passive: true })
    })
  })

  describe('Edge cases', () => {
    it('should handle zero document height', () => {
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        writable: true,
        configurable: true,
        value: 800,
      })
      
      Object.defineProperty(window, 'scrollY', {
        writable: true,
        configurable: true,
        value: 0,
      })
      
      const { container } = render(<ReadingProgress />)
      
      expect(container.firstChild).toBeNull()
    })

    it('should handle missing target element', () => {
      global.document.getElementById = jest.fn().mockReturnValue(null)
      Object.defineProperty(window, 'scrollY', {
        writable: true,
        configurable: true,
        value: 100,
      })
      
      const { container } = render(<ReadingProgress />)
      
      expect(container.firstChild).toBeNull()
    })
  })
})
