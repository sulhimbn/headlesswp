import { render, screen } from '@testing-library/react'
import ReadingProgress from '@/components/ui/ReadingProgress'

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}))

describe('ReadingProgress', () => {
  let originalInnerHeight: number

  beforeEach(() => {
    originalInnerHeight = window.innerHeight
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true })
    Object.defineProperty(window, 'requestAnimationFrame', {
      value: (callback: FrameRequestCallback) => {
        callback(0)
        return 0
      },
      writable: true,
    })
    jest.useFakeTimers()
    jest.clearAllMocks()
  })

  afterEach(() => {
    Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight, writable: true })
    jest.useRealTimers()
  })

  describe('Hidden state', () => {
    it('should not render when at top of page', () => {
      Object.defineProperty(window, 'scrollY', { value: 0, writable: true })
      Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, writable: true })

      const { container } = render(<ReadingProgress />)
      
      expect(container.firstChild).toBeNull()
    })

    it('should not render when element not found', () => {
      jest.spyOn(document, 'getElementById').mockReturnValue(null)
      Object.defineProperty(window, 'scrollY', { value: 100, writable: true })

      const { container } = render(<ReadingProgress targetId="non-existent" />)
      
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Event listeners', () => {
    it('should add scroll event listener', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
      
      render(<ReadingProgress />)
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true })
    })

    it('should add resize event listener', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
      
      render(<ReadingProgress />)
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function), { passive: true })
    })

    it('should remove event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
      
      const { unmount } = render(<ReadingProgress />)
      unmount()
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    })
  })

  describe('Component', () => {
    it('should render with default targetId', () => {
      const { unmount } = render(<ReadingProgress />)
      unmount()
    })

    it('should render with custom targetId', () => {
      const { unmount } = render(<ReadingProgress targetId="custom" />)
      unmount()
    })
  })
})
