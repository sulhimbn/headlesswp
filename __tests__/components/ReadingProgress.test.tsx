import { render, screen, cleanup, act } from '@testing-library/react'
import ReadingProgress from '@/components/ui/ReadingProgress'

describe('ReadingProgress Component', () => {
  const setupScrollMock = (scrollY: number, innerHeight: number, scrollHeight: number, targetId: string = 'article-content') => {
    Object.defineProperty(window, 'scrollY', { value: scrollY, writable: true, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: innerHeight, writable: true, configurable: true })
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: scrollHeight, writable: true, configurable: true })
    document.body.innerHTML = targetId ? `<div id="${targetId}">Content</div>` : '<div></div>'
  }

  beforeEach(() => {
    jest.useFakeTimers()
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      cb(0)
      return 0
    })
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
    cleanup()
  })

  describe('Rendering', () => {
    test('renders progress bar when there is progress', () => {
      setupScrollMock(100, 600, 2000)
      
      render(<ReadingProgress />)
      act(() => {
        jest.runAllTimers()
      })
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    test('does not render when progress is zero', () => {
      setupScrollMock(0, 600, 600)
      
      render(<ReadingProgress />)
      act(() => {
        jest.runAllTimers()
      })
      
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })

    test('renders with custom targetId', () => {
      setupScrollMock(100, 600, 2000, 'custom-content')
      
      render(<ReadingProgress targetId="custom-content" />)
      act(() => {
        jest.runAllTimers()
      })
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })

  describe('ARIA Attributes', () => {
    test('has correct aria-label', () => {
      setupScrollMock(100, 600, 2000)
      
      render(<ReadingProgress />)
      act(() => {
        jest.runAllTimers()
      })
      
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'Kemajuan membaca')
    })

    test('has correct aria-valuemin', () => {
      setupScrollMock(100, 600, 2000)
      
      render(<ReadingProgress />)
      act(() => {
        jest.runAllTimers()
      })
      
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemin', '0')
    })

    test('has correct aria-valuemax', () => {
      setupScrollMock(100, 600, 2000)
      
      render(<ReadingProgress />)
      act(() => {
        jest.runAllTimers()
      })
      
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '100')
    })
  })

  describe('Visual Styles', () => {
    test('has fixed positioning', () => {
      setupScrollMock(100, 600, 2000)
      
      render(<ReadingProgress />)
      act(() => {
        jest.runAllTimers()
      })
      
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveClass('fixed', 'top-0', 'left-0', 'right-0', 'z-50')
    })

    test('has correct height', () => {
      setupScrollMock(100, 600, 2000)
      
      render(<ReadingProgress />)
      act(() => {
        jest.runAllTimers()
      })
      
      expect(screen.getByRole('progressbar')).toHaveClass('h-1')
    })

    test('has transparent background', () => {
      setupScrollMock(100, 600, 2000)
      
      render(<ReadingProgress />)
      act(() => {
        jest.runAllTimers()
      })
      
      expect(screen.getByRole('progressbar')).toHaveClass('bg-transparent')
    })

    test('has inner progress bar with primary color', () => {
      setupScrollMock(100, 600, 2000)
      
      render(<ReadingProgress />)
      act(() => {
        jest.runAllTimers()
      })
      
      const innerBar = screen.getByRole('progressbar').firstChild as HTMLElement
      expect(innerBar).toHaveClass('h-full', 'bg-[hsl(var(--color-primary))]')
    })
  })

  describe('Edge Cases', () => {
    test('handles zero document height', () => {
      setupScrollMock(0, 600, 600)
      
      render(<ReadingProgress />)
      act(() => {
        jest.runAllTimers()
      })
      
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })

    test('handles small document height', () => {
      setupScrollMock(0, 2000, 2000)
      
      render(<ReadingProgress />)
      act(() => {
        jest.runAllTimers()
      })
      
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })

    test('renders without crashing when targetId is provided', () => {
      setupScrollMock(100, 600, 2000, 'my-article')
      
      render(<ReadingProgress targetId="my-article" />)
      act(() => {
        jest.runAllTimers()
      })
      
      expect(screen.queryByRole('progressbar')).toBeInTheDocument()
    })
  })

  describe('Animation', () => {
    test('inner bar has transition styles', () => {
      setupScrollMock(100, 600, 2000)
      
      render(<ReadingProgress />)
      act(() => {
        jest.runAllTimers()
      })
      
      const innerBar = screen.getByRole('progressbar').firstChild as HTMLElement
      expect(innerBar).toHaveClass('transition-all', 'duration-150', 'ease-out')
    })
  })
})