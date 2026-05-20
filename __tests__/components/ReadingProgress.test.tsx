import { render, screen } from '@testing-library/react'
import ReadingProgress from '@/components/ui/ReadingProgress'

describe('ReadingProgress Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    document.getElementById = jest.fn().mockReturnValue({
      scrollHeight: 1000,
      getBoundingClientRect: () => ({ top: 0 }),
    })
    window.scrollY = 0
    window.innerHeight = 800
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 1800,
      writable: true,
    })
  })

  describe('Rendering', () => {
    test('renders progress bar when there is scroll progress', () => {
      window.scrollY = 500
      document.getElementById = jest.fn().mockReturnValue({
        scrollHeight: 1000,
        getBoundingClientRect: () => ({ top: 0 }),
      })
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 1800,
        writable: true,
      })
      
      render(<ReadingProgress />)
      
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()
    })

    test('renders with custom targetId', () => {
      window.scrollY = 500
      document.getElementById = jest.fn().mockReturnValue({
        scrollHeight: 1000,
        getBoundingClientRect: () => ({ top: 0 }),
      })
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 1800,
        writable: true,
      })
      
      render(<ReadingProgress targetId="custom-content" />)
      
      expect(document.getElementById).toHaveBeenCalledWith('custom-content')
    })
  })

  describe('Empty State', () => {
    test('returns null when scrollY is 0', () => {
      window.scrollY = 0
      
      const { container } = render(<ReadingProgress />)
      
      expect(container.firstChild).toBeNull()
    })

    test('returns null when target element does not exist', () => {
      window.scrollY = 500
      document.getElementById = jest.fn().mockReturnValue(null)
      
      const { container } = render(<ReadingProgress />)
      
      expect(container.firstChild).toBeNull()
    })

    test('returns null when document height equals window height', () => {
      window.scrollY = 500
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 800,
        writable: true,
      })
      
      const { container } = render(<ReadingProgress />)
      
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Progress Calculation', () => {
    test('calculates 0% progress at top of page', () => {
      window.scrollY = 0
      
      const { container } = render(<ReadingProgress />)
      
      expect(container.firstChild).toBeNull()
    })

    test('calculates 50% progress at middle of scrollable area', () => {
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 1800,
        writable: true,
      })
      
      window.scrollY = 500
      window.innerHeight = 800
      
      render(<ReadingProgress />)
      
      const progressBar = screen.getByRole('progressbar')
      const progressFill = progressBar.firstChild as HTMLElement
      expect(progressFill.style.width).toBe('50%')
    })

    test('calculates 100% progress at bottom of page', () => {
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 1800,
        writable: true,
      })
      
      window.scrollY = 1000
      window.innerHeight = 800
      
      render(<ReadingProgress />)
      
      const progressBar = screen.getByRole('progressbar')
      const progressFill = progressBar.firstChild as HTMLElement
      expect(progressFill.style.width).toBe('100%')
    })

    test('clamps progress to 0-100 range', () => {
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 1800,
        writable: true,
      })
      
      window.scrollY = 2000
      
      render(<ReadingProgress />)
      
      const progressBar = screen.getByRole('progressbar')
      const progressFill = progressBar.firstChild as HTMLElement
      expect(progressFill.style.width).toBe('100%')
    })
  })

  describe('Accessibility', () => {
    test('has progressbar role', () => {
      window.scrollY = 500
      document.getElementById = jest.fn().mockReturnValue({
        scrollHeight: 1000,
        getBoundingClientRect: () => ({ top: 0 }),
      })
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 1800,
        writable: true,
      })
      
      render(<ReadingProgress />)
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    test('has aria-valuenow attribute', () => {
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 1800,
        writable: true,
      })
      
      window.scrollY = 500
      
      render(<ReadingProgress />)
      
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow', '50')
    })

    test('has aria-valuemin of 0', () => {
      window.scrollY = 500
      document.getElementById = jest.fn().mockReturnValue({
        scrollHeight: 1000,
        getBoundingClientRect: () => ({ top: 0 }),
      })
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 1800,
        writable: true,
      })
      
      render(<ReadingProgress />)
      
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuemin', '0')
    })

    test('has aria-valuemax of 100', () => {
      window.scrollY = 500
      document.getElementById = jest.fn().mockReturnValue({
        scrollHeight: 1000,
        getBoundingClientRect: () => ({ top: 0 }),
      })
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 1800,
        writable: true,
      })
      
      render(<ReadingProgress />)
      
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuemax', '100')
    })

    test('has aria-label', () => {
      window.scrollY = 500
      document.getElementById = jest.fn().mockReturnValue({
        scrollHeight: 1000,
        getBoundingClientRect: () => ({ top: 0 }),
      })
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 1800,
        writable: true,
      })
      
      render(<ReadingProgress />)
      
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-label', 'Kemajuan membaca')
    })
  })

  describe('Styling', () => {
    test('has fixed position', () => {
      window.scrollY = 500
      document.getElementById = jest.fn().mockReturnValue({
        scrollHeight: 1000,
        getBoundingClientRect: () => ({ top: 0 }),
      })
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 1800,
        writable: true,
      })
      
      render(<ReadingProgress />)
      
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveClass('fixed', 'top-0', 'left-0', 'right-0')
    })

    test('has z-50', () => {
      window.scrollY = 500
      document.getElementById = jest.fn().mockReturnValue({
        scrollHeight: 1000,
        getBoundingClientRect: () => ({ top: 0 }),
      })
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 1800,
        writable: true,
      })
      
      render(<ReadingProgress />)
      
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveClass('z-50')
    })

    test('has height 1', () => {
      window.scrollY = 500
      document.getElementById = jest.fn().mockReturnValue({
        scrollHeight: 1000,
        getBoundingClientRect: () => ({ top: 0 }),
      })
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 1800,
        writable: true,
      })
      
      render(<ReadingProgress />)
      
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveClass('h-1')
    })

    test('has transparent background', () => {
      window.scrollY = 500
      document.getElementById = jest.fn().mockReturnValue({
        scrollHeight: 1000,
        getBoundingClientRect: () => ({ top: 0 }),
      })
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 1800,
        writable: true,
      })
      
      render(<ReadingProgress />)
      
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveClass('bg-transparent')
    })

    test('progress fill uses primary color', () => {
      window.scrollY = 500
      document.getElementById = jest.fn().mockReturnValue({
        scrollHeight: 1000,
        getBoundingClientRect: () => ({ top: 0 }),
      })
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 1800,
        writable: true,
      })
      
      render(<ReadingProgress />)
      
      const progressBar = screen.getByRole('progressbar')
      const progressFill = progressBar.firstChild as HTMLElement
      expect(progressFill).toHaveClass('bg-[hsl(var(--color-primary))]')
    })

    test('progress fill has transition-all', () => {
      window.scrollY = 500
      document.getElementById = jest.fn().mockReturnValue({
        scrollHeight: 1000,
        getBoundingClientRect: () => ({ top: 0 }),
      })
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 1800,
        writable: true,
      })
      
      render(<ReadingProgress />)
      
      const progressBar = screen.getByRole('progressbar')
      const progressFill = progressBar.firstChild as HTMLElement
      expect(progressFill).toHaveClass('transition-all', 'duration-150', 'ease-out')
    })

    test('progress fill has full height', () => {
      window.scrollY = 500
      document.getElementById = jest.fn().mockReturnValue({
        scrollHeight: 1000,
        getBoundingClientRect: () => ({ top: 0 }),
      })
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 1800,
        writable: true,
      })
      
      render(<ReadingProgress />)
      
      const progressBar = screen.getByRole('progressbar')
      const progressFill = progressBar.firstChild as HTMLElement
      expect(progressFill).toHaveClass('h-full')
    })
  })

  describe('Event Listeners', () => {
    test('adds scroll event listener', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
      
      render(<ReadingProgress />)
      
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        { passive: true }
      )
    })

    test('adds resize event listener', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
      
      render(<ReadingProgress />)
      
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function),
        { passive: true }
      )
    })

    test('removes scroll event listener on cleanup', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
      
      const { unmount } = render(<ReadingProgress />)
      unmount()
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function)
      )
    })

    test('removes resize event listener on cleanup', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
      
      const { unmount } = render(<ReadingProgress />)
      unmount()
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      )
    })
  })

  describe('Target ID', () => {
    test('uses default targetId', () => {
      render(<ReadingProgress />)
      
      expect(document.getElementById).toHaveBeenCalledWith('article-content')
    })

    test('uses custom targetId when provided', () => {
      render(<ReadingProgress targetId="custom-target" />)
      
      expect(document.getElementById).toHaveBeenCalledWith('custom-target')
    })
  })
})
