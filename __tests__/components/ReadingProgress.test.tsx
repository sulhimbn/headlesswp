import { render, screen, act } from '@testing-library/react'
import ReadingProgress from '@/components/ui/ReadingProgress'
import React from 'react'

const mockScrollTo = jest.fn()
const originalWindow = global.window

let scrollY = 0
let innerHeight = 768
let scrollHeight = 2000
let targetElement: HTMLElement | null = { offsetHeight: 500 } as HTMLElement

const setupWindowMock = () => {
  Object.defineProperty(global.window, 'scrollY', {
    get: () => scrollY,
    configurable: true,
  })
  Object.defineProperty(global.window, 'pageYOffset', {
    get: () => scrollY,
    configurable: true,
  })
  Object.defineProperty(global.window, 'innerHeight', {
    get: () => innerHeight,
    configurable: true,
  })
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    get: () => scrollHeight,
    configurable: true,
  })
  Object.defineProperty(document, 'getElementById', {
    value: jest.fn().mockReturnValue(targetElement),
    configurable: true,
  })
  global.window.scrollTo = mockScrollTo as unknown as (options?: ScrollToOptions) => void
  global.window.requestAnimationFrame = jest.fn((callback) => {
    callback()
    return 0
  }) as unknown as (callback: FrameRequestCallback) => number
}

describe('ReadingProgress Component', () => {
  let addEventListenerSpy: jest.SpyInstance
  let removeEventListenerSpy: jest.SpyInstance
  let originalGetElementById: typeof document.getElementById

  beforeEach(() => {
    originalGetElementById = document.getElementById.bind(document)
    scrollY = 0
    innerHeight = 768
    scrollHeight = 2000
    targetElement = { offsetHeight: 500 } as HTMLElement
    setupWindowMock()
    addEventListenerSpy = jest.spyOn(global.window, 'addEventListener')
    removeEventListenerSpy = jest.spyOn(global.window, 'removeEventListener')
  })

  afterEach(() => {
    Object.defineProperty(document, 'getElementById', {
      value: originalGetElementById,
      configurable: true,
    })
    addEventListenerSpy.mockRestore()
    removeEventListenerSpy.mockRestore()
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    test('renders progress bar when scrolled', () => {
      scrollY = 500
      render(<ReadingProgress />)
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    test('returns null when progress is zero', () => {
      scrollY = 0
      const { container } = render(<ReadingProgress />)
      expect(container.firstChild).toBeNull()
    })

    test('renders container with correct styling classes', () => {
      scrollY = 500
      render(<ReadingProgress />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveClass('fixed', 'top-0', 'left-0', 'right-0', 'z-50', 'h-1', 'bg-transparent')
    })

    test('renders inner progress bar with correct styling', () => {
      scrollY = 500
      render(<ReadingProgress />)
      const progressbar = screen.getByRole('progressbar')
      const innerBar = progressbar.querySelector('div')
      expect(innerBar).toHaveClass('h-full', 'bg-[hsl(var(--color-primary))]', 'transition-all', 'duration-150', 'ease-out')
    })
  })

  describe('Progress Percentage Calculation', () => {
    test('calculates 0% progress at top of page', () => {
      scrollY = 0
      render(<ReadingProgress />)
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })

    test('calculates 50% progress at middle scroll position', () => {
      const documentHeight = scrollHeight - innerHeight
      scrollY = documentHeight * 0.5
      render(<ReadingProgress />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-valuenow', '50')
      const innerBar = progressbar.querySelector('div')
      expect(innerBar).toHaveStyle({ width: '50%' })
    })

    test('calculates 100% progress at bottom of page', () => {
      const documentHeight = scrollHeight - innerHeight
      scrollY = documentHeight
      render(<ReadingProgress />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-valuenow', '100')
      const innerBar = progressbar.querySelector('div')
      expect(innerBar).toHaveStyle({ width: '100%' })
    })

    test('clamps progress between 0 and 100', () => {
      scrollY = 5000
      render(<ReadingProgress />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-valuenow', '100')
    })

    test('handles custom targetId', () => {
      targetElement = { offsetHeight: 300 } as HTMLElement
      scrollY = 500
      render(<ReadingProgress targetId="custom-target" />)
      expect(document.getElementById).toHaveBeenCalledWith('custom-target')
    })
  })

  describe('Visibility at Different Scroll Thresholds', () => {
    test('not visible when not scrolled', () => {
      scrollY = 0
      const { container } = render(<ReadingProgress />)
      expect(container.firstChild).toBeNull()
    })

    test('visible when scrolled 100px', () => {
      scrollY = 100
      render(<ReadingProgress />)
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    test('visible when scrolled 1px', () => {
      scrollY = 1
      render(<ReadingProgress />)
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })

  describe('Container Styling', () => {
    test('applies fixed positioning', () => {
      scrollY = 500
      render(<ReadingProgress />)
      expect(screen.getByRole('progressbar')).toHaveClass('fixed')
    })

    test('applies z-index of 50', () => {
      scrollY = 500
      render(<ReadingProgress />)
      expect(screen.getByRole('progressbar')).toHaveClass('z-50')
    })

    test('applies height of 1', () => {
      scrollY = 500
      render(<ReadingProgress />)
      expect(screen.getByRole('progressbar')).toHaveClass('h-1')
    })

    test('applies transparent background', () => {
      scrollY = 500
      render(<ReadingProgress />)
      expect(screen.getByRole('progressbar')).toHaveClass('bg-transparent')
    })

    test('applies left-0 and right-0 for full width', () => {
      scrollY = 500
      render(<ReadingProgress />)
      expect(screen.getByRole('progressbar')).toHaveClass('left-0', 'right-0')
    })

    test('applies top-0 positioning', () => {
      scrollY = 500
      render(<ReadingProgress />)
      expect(screen.getByRole('progressbar')).toHaveClass('top-0')
    })
  })

  describe('Accessibility', () => {
    test('has role="progressbar"', () => {
      scrollY = 500
      render(<ReadingProgress />)
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    test('has aria-valuenow attribute', () => {
      scrollY = 500
      render(<ReadingProgress />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-valuenow')
    })

    test('has aria-valuemin set to 0', () => {
      scrollY = 500
      render(<ReadingProgress />)
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemin', '0')
    })

    test('has aria-valuemax set to 100', () => {
      scrollY = 500
      render(<ReadingProgress />)
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '100')
    })

    test('has aria-label for screen readers', () => {
      scrollY = 500
      render(<ReadingProgress />)
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'Kemajuan membaca')
    })

    test('aria-valuenow reflects current progress', () => {
      scrollY = 300
      render(<ReadingProgress />)
      const progressbar = screen.getByRole('progressbar')
      const expectedProgress = Math.round((300 / (scrollHeight - innerHeight)) * 100)
      expect(progressbar).toHaveAttribute('aria-valuenow', expectedProgress.toString())
    })
  })

  describe('Memoization', () => {
    test('component is memoized', () => {
      expect((ReadingProgress as React.ComponentType<unknown>).type).toBeDefined()
    })

    test('skips re-render when progress has not changed', () => {
      scrollY = 500
      const { rerender } = render(<ReadingProgress />)
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
      rerender(<ReadingProgress />)
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })

  describe('Event Listeners', () => {
    test('adds scroll event listener', () => {
      render(<ReadingProgress />)
      expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true })
    })

    test('adds resize event listener', () => {
      render(<ReadingProgress />)
      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function), { passive: true })
    })

    test('removes scroll event listener on unmount', () => {
      const { unmount } = render(<ReadingProgress />)
      unmount()
      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
    })

    test('removes resize event listener on unmount', () => {
      const { unmount } = render(<ReadingProgress />)
      unmount()
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    })
  })

  describe('Edge Cases', () => {
    test('handles target element not found', () => {
      Object.defineProperty(document, 'getElementById', {
        value: jest.fn().mockReturnValue(null),
        configurable: true,
      })
      scrollY = 500
      const { container } = render(<ReadingProgress />)
      expect(container.firstChild).toBeNull()
    })

    test('handles zero document height', () => {
      scrollHeight = innerHeight
      scrollY = 500
      render(<ReadingProgress />)
      const { container } = render(<ReadingProgress />)
      expect(container.firstChild).toBeNull()
    })

    test('uses default targetId when not provided', () => {
      scrollY = 500
      render(<ReadingProgress />)
      expect(document.getElementById).toHaveBeenCalledWith('article-content')
    })

    test('applies custom targetId correctly', () => {
      scrollY = 500
      render(<ReadingProgress targetId="custom-id" />)
      expect(document.getElementById).toHaveBeenCalledWith('custom-id')
    })
  })
})
