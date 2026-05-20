import { render, screen } from '@testing-library/react'
import ReadingProgress from '@/components/ui/ReadingProgress'

const mockScrollY = (scrollValue: number) => {
  Object.defineProperty(window, 'pageYOffset', {
    value: scrollValue,
    writable: true,
  })
  Object.defineProperty(window, 'scrollY', {
    value: scrollValue,
    writable: true,
  })
}

const mockScrollHeight = (height: number) => {
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    value: height,
    writable: true,
  })
}

const mockInnerHeight = (innerHeightValue: number) => {
  Object.defineProperty(window, 'innerHeight', {
    value: innerHeightValue,
    writable: true,
  })
}

const mockGetElementById = (element: HTMLElement | null) => {
  return jest.spyOn(document, 'getElementById').mockReturnValue(element)
}

beforeEach(() => {
  jest.clearAllMocks()
  mockScrollY(0)
  mockScrollHeight(2000)
  mockInnerHeight(800)
  mockGetElementById(null)
})

describe('ReadingProgress Component', () => {
  describe('Rendering', () => {
    test('renders progress bar when there is scroll progress', () => {
      mockScrollY(500)
      mockGetElementById(document.createElement('div'))
      
      render(<ReadingProgress />)
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    test('renders with custom targetId', () => {
      const targetElement = document.createElement('div')
      targetElement.id = 'custom-target'
      mockGetElementById(targetElement)
      mockScrollY(100)
      
      render(<ReadingProgress targetId="custom-target" />)
      expect(document.getElementById).toHaveBeenCalledWith('custom-target')
    })

    test('uses default targetId', () => {
      const targetElement = document.createElement('div')
      targetElement.id = 'article-content'
      mockGetElementById(targetElement)
      mockScrollY(100)
      
      render(<ReadingProgress />)
      expect(document.getElementById).toHaveBeenCalledWith('article-content')
    })
  })

  describe('No Progress', () => {
    test('returns null when scrollY is 0', () => {
      mockScrollY(0)
      mockGetElementById(document.createElement('div'))
      
      const { container } = render(<ReadingProgress />)
      expect(container.firstChild).toBeNull()
    })

    test('returns null when target element does not exist', () => {
      mockGetElementById(null)
      
      const { container } = render(<ReadingProgress />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Progress Calculation', () => {
    test('calculates 25% progress correctly', () => {
      mockScrollY(300)
      mockScrollHeight(2000)
      mockInnerHeight(800)
      mockGetElementById(document.createElement('div'))
      
      render(<ReadingProgress />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-valuenow', '25')
    })

    test('calculates 50% progress correctly', () => {
      mockScrollY(600)
      mockScrollHeight(2000)
      mockInnerHeight(800)
      mockGetElementById(document.createElement('div'))
      
      render(<ReadingProgress />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-valuenow', '50')
    })

    test('calculates 75% progress correctly', () => {
      mockScrollY(900)
      mockScrollHeight(2000)
      mockInnerHeight(800)
      mockGetElementById(document.createElement('div'))
      
      render(<ReadingProgress />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-valuenow', '75')
    })

    test('calculates 100% progress correctly', () => {
      mockScrollY(1200)
      mockScrollHeight(2000)
      mockInnerHeight(800)
      mockGetElementById(document.createElement('div'))
      
      render(<ReadingProgress />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-valuenow', '100')
    })

    test('caps progress at 100%', () => {
      mockScrollY(2000)
      mockScrollHeight(2000)
      mockInnerHeight(800)
      mockGetElementById(document.createElement('div'))
      
      render(<ReadingProgress />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-valuenow', '100')
    })
  })

  describe('Event Listeners', () => {
    test('adds scroll event listener', () => {
      mockGetElementById(document.createElement('div'))
      mockScrollY(100)
      
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
      render(<ReadingProgress />)
      
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        { passive: true }
      )
    })

    test('adds resize event listener', () => {
      mockGetElementById(document.createElement('div'))
      mockScrollY(100)
      
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
      render(<ReadingProgress />)
      
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function),
        { passive: true }
      )
    })

    test('removes scroll event listener on cleanup', () => {
      mockGetElementById(document.createElement('div'))
      mockScrollY(100)
      
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
      const { unmount } = render(<ReadingProgress />)
      unmount()
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
    })

    test('removes resize event listener on cleanup', () => {
      mockGetElementById(document.createElement('div'))
      mockScrollY(100)
      
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
      const { unmount } = render(<ReadingProgress />)
      unmount()
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    })
  })

  describe('Accessibility', () => {
    test('has progressbar role', () => {
      mockScrollY(500)
      mockGetElementById(document.createElement('div'))
      
      render(<ReadingProgress />)
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    test('has aria-valuemin attribute', () => {
      mockScrollY(500)
      mockGetElementById(document.createElement('div'))
      
      render(<ReadingProgress />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-valuemin', '0')
    })

    test('has aria-valuemax attribute', () => {
      mockScrollY(500)
      mockGetElementById(document.createElement('div'))
      
      render(<ReadingProgress />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-valuemax', '100')
    })

    test('has aria-valuenow attribute', () => {
      mockScrollY(500)
      mockScrollHeight(2000)
      mockInnerHeight(800)
      mockGetElementById(document.createElement('div'))
      
      render(<ReadingProgress />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-valuenow', expect.any(String))
    })

    test('has aria-label', () => {
      mockScrollY(500)
      mockGetElementById(document.createElement('div'))
      
      render(<ReadingProgress />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-label', 'Kemajuan membaca')
    })

    test('aria-valuenow is rounded to integer', () => {
      mockScrollY(300)
      mockScrollHeight(2000)
      mockInnerHeight(800)
      mockGetElementById(document.createElement('div'))
      
      render(<ReadingProgress />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-valuenow', '25')
    })
  })

  describe('Styles', () => {
    test('has fixed position', () => {
      mockScrollY(500)
      mockGetElementById(document.createElement('div'))
      
      render(<ReadingProgress />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveClass('fixed', 'top-0', 'left-0', 'right-0')
    })

    test('has z-index 50', () => {
      mockScrollY(500)
      mockGetElementById(document.createElement('div'))
      
      render(<ReadingProgress />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveClass('z-50')
    })

    test('has height 1', () => {
      mockScrollY(500)
      mockGetElementById(document.createElement('div'))
      
      render(<ReadingProgress />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveClass('h-1')
    })

    test('has transparent background', () => {
      mockScrollY(500)
      mockGetElementById(document.createElement('div'))
      
      render(<ReadingProgress />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveClass('bg-transparent')
    })

    test('progress bar has primary color', () => {
      mockScrollY(500)
      mockGetElementById(document.createElement('div'))
      
      render(<ReadingProgress />)
      const progressBar = screen.getByRole('progressbar').firstElementChild
      expect(progressBar).toHaveClass('bg-[hsl(var(--color-primary))]')
    })

    test('progress bar has transition styles', () => {
      mockScrollY(500)
      mockGetElementById(document.createElement('div'))
      
      render(<ReadingProgress />)
      const progressBar = screen.getByRole('progressbar').firstElementChild
      expect(progressBar).toHaveClass('transition-all', 'duration-150', 'ease-out')
    })

    test('progress bar width is set dynamically', () => {
      mockScrollY(600)
      mockScrollHeight(2000)
      mockInnerHeight(800)
      mockGetElementById(document.createElement('div'))
      
      render(<ReadingProgress />)
      const progressBar = screen.getByRole('progressbar').firstElementChild
      expect(progressBar).toHaveStyle({ width: '50%' })
    })
  })

  describe('Memoization', () => {
    test('component is memoized', () => {
      mockGetElementById(document.createElement('div'))
      mockScrollY(100)
      
      const { rerender } = render(<ReadingProgress />)
      expect(screen.queryByRole('progressbar')).toBeInTheDocument()
      rerender(<ReadingProgress />)
      expect(screen.queryByRole('progressbar')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    test('handles zero document height', () => {
      mockScrollY(0)
      mockScrollHeight(800)
      mockInnerHeight(800)
      mockGetElementById(document.createElement('div'))
      
      const { container } = render(<ReadingProgress />)
      expect(container.firstChild).toBeNull()
    })

    test('handles negative scroll position', () => {
      mockScrollY(-100)
      mockScrollHeight(2000)
      mockInnerHeight(800)
      mockGetElementById(document.createElement('div'))
      
      const { container } = render(<ReadingProgress />)
      expect(container.firstChild).toBeNull()
    })

    test('handles scroll beyond document', () => {
      mockScrollY(5000)
      mockScrollHeight(2000)
      mockInnerHeight(800)
      mockGetElementById(document.createElement('div'))
      
      render(<ReadingProgress />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-valuenow', '100')
    })

    test('respects custom targetId prop', () => {
      mockGetElementById(null)
      mockScrollY(100)
      
      render(<ReadingProgress targetId="my-article" />)
      expect(document.getElementById).toHaveBeenCalledWith('my-article')
    })
  })
})
