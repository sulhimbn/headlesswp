import { render, screen, waitFor, act } from '@testing-library/react'
import ReadingProgress from '@/components/ui/ReadingProgress'

jest.spyOn(window, 'scrollTo').mockImplementation(() => {})
jest.spyOn(window, 'addEventListener').mockImplementation(() => {})
jest.spyOn(window, 'removeEventListener').mockImplementation(() => {})

const mockRequestAnimationFrame = jest.fn((callback: unknown) => {
  if (typeof callback === 'function') {
    callback()
  }
  return 1
})
global.requestAnimationFrame = mockRequestAnimationFrame
global.cancelAnimationFrame = jest.fn()

function setupScrollMock(scrollY: number, scrollHeight: number, innerHeight: number) {
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    value: scrollHeight,
    writable: true,
    configurable: true
  })
  Object.defineProperty(window, 'scrollY', {
    value: scrollY,
    writable: true,
    configurable: true
  })
  Object.defineProperty(window, 'innerHeight', {
    value: innerHeight,
    writable: true,
    configurable: true
  })
}

describe('ReadingProgress Component', () => {
  let articleElement: HTMLDivElement

  beforeEach(() => {
    jest.clearAllMocks()
    mockRequestAnimationFrame.mockImplementation((callback: unknown) => {
      if (typeof callback === 'function') {
        callback()
      }
      return 1
    })
    setupScrollMock(0, 1000, 800)
    
    articleElement = document.createElement('div')
    articleElement.id = 'article-content'
    document.body.appendChild(articleElement)
  })

  afterEach(() => {
    document.body.removeChild(articleElement)
  })

  describe('Progress bar renders', () => {
    test('renders progress bar when scroll position > 0', async () => {
      setupScrollMock(100, 2000, 800)

      render(<ReadingProgress />)

      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument()
      }, { timeout: 1000 })
    })

    test('renders progress bar with correct aria attributes', async () => {
      setupScrollMock(500, 2000, 800)

      render(<ReadingProgress />)

      await waitFor(() => {
        const progressbar = screen.getByRole('progressbar')
        expect(progressbar).toHaveAttribute('aria-valuemin', '0')
        expect(progressbar).toHaveAttribute('aria-valuemax', '100')
        expect(progressbar).toHaveAttribute('aria-label', 'Kemajuan membaca')
      }, { timeout: 1000 })
    })

    test('renders inner progress div with width style', async () => {
      setupScrollMock(500, 2000, 800)

      render(<ReadingProgress />)

      await waitFor(() => {
        const innerDiv = screen.getByRole('progressbar').firstChild as HTMLElement
        expect(innerDiv.style.width).toBeTruthy()
      }, { timeout: 1000 })
    })
  })

  describe('Scroll percentage calculation', () => {
    test('calculates progress at 0% when not scrolled', () => {
      setupScrollMock(0, 1000, 800)

      render(<ReadingProgress />)
      
      const container = screen.queryByRole('progressbar')
      expect(container).toBeNull()
    })

    test('calculates progress at 50%', async () => {
      setupScrollMock(100, 1000, 800)

      render(<ReadingProgress />)

      await waitFor(() => {
        const progressbar = screen.getByRole('progressbar')
        expect(progressbar).toHaveAttribute('aria-valuenow', '50')
      }, { timeout: 1000 })
    })

    test('calculates progress at 100%', async () => {
      setupScrollMock(200, 1000, 800)

      render(<ReadingProgress />)

      await waitFor(() => {
        const progressbar = screen.getByRole('progressbar')
        expect(progressbar).toHaveAttribute('aria-valuenow', '100')
      }, { timeout: 1000 })
    })

    test('caps progress at 100% when scrolled past', async () => {
      setupScrollMock(500, 1000, 800)

      render(<ReadingProgress />)

      await waitFor(() => {
        const progressbar = screen.getByRole('progressbar')
        expect(progressbar).toHaveAttribute('aria-valuenow', '100')
      }, { timeout: 1000 })
    })

    test('uses custom targetId', async () => {
      setupScrollMock(100, 1000, 800)

      const customElement = document.createElement('div')
      customElement.id = 'custom-content'
      document.body.appendChild(customElement)

      render(<ReadingProgress targetId="custom-content" />)

      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument()
      }, { timeout: 1000 })

      document.body.removeChild(customElement)
    })
  })

  describe('Progress updates on scroll', () => {
    test('adds scroll event listener on mount', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
      
      render(<ReadingProgress />)
      
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        { passive: true }
      )
    })

    test('adds resize event listener on mount', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
      
      render(<ReadingProgress />)
      
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function),
        { passive: true }
      )
    })
  })

  describe('Cleanup on unmount', () => {
    test('removes scroll event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
      
      const { unmount } = render(<ReadingProgress />)
      unmount()
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function)
      )
    })

    test('removes resize event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
      
      const { unmount } = render(<ReadingProgress />)
      unmount()
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      )
    })
  })

  describe('Memoization', () => {
    test('component is memoized', async () => {
      setupScrollMock(100, 1000, 800)

      const { rerender } = render(<ReadingProgress />)

      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument()
      }, { timeout: 1000 })

      rerender(<ReadingProgress targetId="article-content" />)
    })
  })

  describe('Edge cases', () => {
    test('returns null when target element does not exist', () => {
      document.body.removeChild(articleElement)
      setupScrollMock(100, 1000, 800)
      
      const { container } = render(<ReadingProgress targetId="non-existent" />)
      
      expect(container.firstChild).toBeNull()
      
      document.body.appendChild(articleElement)
    })

    test('handles zero document height', () => {
      setupScrollMock(100, 800, 800)

      const { container } = render(<ReadingProgress />)
      
      expect(container.firstChild).toBeNull()
    })
  })
})
