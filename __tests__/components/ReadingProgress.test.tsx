import { render, screen, act } from '@testing-library/react'
import ReadingProgress from '@/components/ui/ReadingProgress'

const mockAddEventListener = jest.fn()
const mockRemoveEventListener = jest.fn()
const mockRequestAnimationFrame = jest.fn(callback => {
  if (typeof callback === 'function') {
    callback()
  }
  return 0
})

Object.defineProperty(window, 'addEventListener', {
  value: mockAddEventListener,
  writable: true,
  configurable: true,
})

Object.defineProperty(window, 'removeEventListener', {
  value: mockRemoveEventListener,
  writable: true,
  configurable: true,
})

Object.defineProperty(window, 'requestAnimationFrame', {
  value: mockRequestAnimationFrame,
  writable: true,
  configurable: true,
})

describe('ReadingProgress Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAddEventListener.mockClear()
    mockRemoveEventListener.mockClear()
    mockRequestAnimationFrame.mockClear()
    
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true, configurable: true })
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, writable: true, configurable: true })
    document.getElementById = jest.fn().mockReturnValue({} as HTMLElement)
  })

  describe('Hidden State', () => {
    test('returns null when scrollY is 0', () => {
      Object.defineProperty(window, 'scrollY', { value: 0, writable: true })
      
      const { container } = render(<ReadingProgress />)
      expect(container.firstChild).toBeNull()
    })

    test('returns null when target element does not exist', () => {
      document.getElementById = jest.fn().mockReturnValue(null)
      
      const { container } = render(<ReadingProgress />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Event Handling', () => {
    test('adds scroll event listener', () => {
      render(<ReadingProgress />)
      
      expect(mockAddEventListener).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        { passive: true }
      )
    })

    test('adds resize event listener', () => {
      render(<ReadingProgress />)
      
      const resizeCall = mockAddEventListener.mock.calls.find(call => call[0] === 'resize')
      expect(resizeCall).toBeDefined()
    })

    test('removes event listeners on unmount', () => {
      const { unmount } = render(<ReadingProgress />)
      unmount()
      
      expect(mockRemoveEventListener).toHaveBeenCalledWith('scroll', expect.any(Function))
      expect(mockRemoveEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
    })
  })

  describe('Target ID', () => {
    test('uses default targetId of article-content', () => {
      render(<ReadingProgress />)
      expect(document.getElementById).toHaveBeenCalledWith('article-content')
    })

    test('accepts custom targetId', () => {
      render(<ReadingProgress targetId="custom-content" />)
      expect(document.getElementById).toHaveBeenCalledWith('custom-content')
    })
  })

  describe('Memoization', () => {
    test('component is memoized', () => {
      const { rerender } = render(<ReadingProgress />)
      rerender(<ReadingProgress />)
      
      expect(mockAddEventListener).toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    test('handles zero document height', () => {
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 800,
        writable: true,
      })
      Object.defineProperty(window, 'innerHeight', {
        value: 800,
        writable: true,
      })
      
      const { container } = render(<ReadingProgress />)
      expect(container.firstChild).toBeNull()
    })
  })
})
