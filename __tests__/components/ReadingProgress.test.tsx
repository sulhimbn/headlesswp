import { render, screen } from '@testing-library/react'
import ReadingProgress from '@/components/ui/ReadingProgress'

describe('ReadingProgress Component', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    document.getElementById = jest.fn().mockReturnValue({
      scrollHeight: 1000,
    })
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true })
    Object.defineProperty(window.document.documentElement, 'scrollHeight', { value: 1000, writable: true })
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  describe('Rendering', () => {
    test('renders nothing when progress is 0', () => {
      window.scrollY = 0
      render(<ReadingProgress />)

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })

    test('renders progress bar when scrolled', () => {
      window.scrollY = 200
      Object.defineProperty(window, 'scrollY', { value: 200, writable: true })

      render(<ReadingProgress />)

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    test('uses custom target id', () => {
      const getElementByIdSpy = jest.fn().mockReturnValue({
        scrollHeight: 1000,
      })
      document.getElementById = getElementByIdSpy
      window.scrollY = 200
      Object.defineProperty(window, 'scrollY', { value: 200, writable: true })

      render(<ReadingProgress targetId="custom-content" />)

      expect(getElementByIdSpy).toHaveBeenCalledWith('custom-content')
    })
  })

  describe('Accessibility', () => {
    test('has proper aria attributes', () => {
      window.scrollY = 200
      Object.defineProperty(window, 'scrollY', { value: 200, writable: true })

      render(<ReadingProgress />)

      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-valuemin', '0')
      expect(progressbar).toHaveAttribute('aria-valuemax', '100')
      expect(progressbar).toHaveAttribute('aria-label', 'Kemajuan membaca')
    })

    test('updates aria-valuenow with scroll position', () => {
      window.scrollY = 500
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true })

      render(<ReadingProgress />)

      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-valuenow', expect.any(String))
    })
  })

  describe('Progress calculation', () => {
    test('calculates 0% at top of page', () => {
      window.scrollY = 0
      Object.defineProperty(window, 'scrollY', { value: 0, writable: true })

      render(<ReadingProgress />)

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })

    test('calculates 100% at bottom of page', () => {
      window.scrollY = 1000
      Object.defineProperty(window, 'scrollY', { value: 1000, writable: true })
      Object.defineProperty(window.document.documentElement, 'scrollHeight', { value: 1000, writable: true })

      render(<ReadingProgress />)

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })

  describe('Scroll event handling', () => {
    test('adds scroll event listener', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
      window.scrollY = 200
      Object.defineProperty(window, 'scrollY', { value: 200, writable: true })

      render(<ReadingProgress />)

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        expect.objectContaining({ passive: true })
      )
    })

    test('adds resize event listener', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
      window.scrollY = 200
      Object.defineProperty(window, 'scrollY', { value: 200, writable: true })

      render(<ReadingProgress />)

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function),
        expect.objectContaining({ passive: true })
      )
    })
  })
})