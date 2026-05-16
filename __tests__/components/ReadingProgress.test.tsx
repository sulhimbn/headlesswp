import { render, screen, act, waitFor } from '@testing-library/react'
import ReadingProgress from '@/components/ui/ReadingProgress'

describe('ReadingProgress Component', () => {
  const originalScrollHeight = Object.getOwnPropertyDescriptor(
    document.documentElement,
    'scrollHeight'
  )

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
    if (originalScrollHeight) {
      Object.defineProperty(document.documentElement, 'scrollHeight', originalScrollHeight)
    }
  })

  describe('Rendering', () => {
    test('returns null when document cannot be scrolled (scrollHeight equals innerHeight)', () => {
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        configurable: true,
        value: 768,
      })
      
      const { container } = render(<ReadingProgress />)
      
      act(() => {
        jest.runAllTimers()
      })
      
      expect(container.firstChild).toBeNull()
    })

    test('returns null when no scroll is possible', () => {
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        configurable: true,
        value: 2000,
      })
      
      const { container } = render(<ReadingProgress />)
      
      act(() => {
        jest.runAllTimers()
      })
      
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Progress calculation', () => {
    test('handles scrollHeight less than or equal to innerHeight', () => {
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        configurable: true,
        value: 768,
      })
      
      const { container } = render(<ReadingProgress />)
      
      act(() => {
        jest.runAllTimers()
      })
      
      expect(container.firstChild).toBeNull()
    })

    test('handles targetId prop with existing element', async () => {
      const targetElement = document.createElement('div')
      targetElement.id = 'article-content'
      document.body.appendChild(targetElement)
      
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        configurable: true,
        value: 2000,
      })
      
      render(<ReadingProgress targetId="article-content" />)
      
      await waitFor(() => {
        expect(document.getElementById('article-content')).toBeInTheDocument()
      })
      
      document.body.removeChild(targetElement)
    })
  })

  describe('Event listeners', () => {
    test('adds scroll listener with passive option', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
      addEventListenerSpy.mockImplementation(() => {})
      
      render(<ReadingProgress />)
      
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        { passive: true }
      )
    })

    test('adds resize listener', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
      addEventListenerSpy.mockImplementation(() => {})
      
      render(<ReadingProgress />)
      
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function),
        { passive: true }
      )
    })

    test('removes scroll listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
      removeEventListenerSpy.mockImplementation(() => {})
      
      const { unmount } = render(<ReadingProgress />)
      unmount()
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
    })

    test('removes resize listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
      removeEventListenerSpy.mockImplementation(() => {})
      
      const { unmount } = render(<ReadingProgress />)
      unmount()
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    })
  })

  describe('Edge cases', () => {
    test('handles missing target element', () => {
      const { container } = render(<ReadingProgress targetId="non-existent" />)
      
      act(() => {
        jest.runAllTimers()
      })
      
      expect(container.firstChild).toBeNull()
    })

    test('handles default targetId', () => {
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        configurable: true,
        value: 768,
      })
      
      const { container } = render(<ReadingProgress />)
      
      act(() => {
        jest.runAllTimers()
      })
      
      expect(container.firstChild).toBeNull()
    })
  })
})
