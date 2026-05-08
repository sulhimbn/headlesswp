import { render, act } from '@testing-library/react'
import ReadingProgress from '@/components/ui/ReadingProgress'

describe('ReadingProgress Component', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'scrollY', {
      value: 0,
      writable: true,
      configurable: true,
    })
    Object.defineProperty(window, 'innerHeight', {
      value: 768,
      writable: true,
      configurable: true,
    })
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 2000,
      writable: true,
      configurable: true,
    })
    jest.spyOn(document, 'getElementById').mockReturnValue(null)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Rendering', () => {
    test('renders nothing when progress is 0', async () => {
      window.scrollY = 0
      const { container } = render(<ReadingProgress targetId="article-content" />)
      await act(async () => {})
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Event Listeners', () => {
    test('adds scroll event listener on mount', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
      render(<ReadingProgress targetId="article-content" />)

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        expect.objectContaining({ passive: true })
      )
    })

    test('adds resize event listener on mount', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
      render(<ReadingProgress targetId="article-content" />)

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function),
        expect.objectContaining({ passive: true })
      )
    })

    test('removes scroll event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
      const { unmount } = render(<ReadingProgress targetId="article-content" />)
      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function)
      )
    })

    test('removes resize event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
      const { unmount } = render(<ReadingProgress targetId="article-content" />)
      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      )
    })
  })

  describe('Target ID', () => {
    test('uses custom targetId prop', () => {
      const getElementByIdSpy = jest.spyOn(document, 'getElementById')
      render(<ReadingProgress targetId="custom-article" />)

      expect(getElementByIdSpy).toHaveBeenCalledWith('custom-article')
    })

    test('uses default targetId when not provided', () => {
      const getElementByIdSpy = jest.spyOn(document, 'getElementById')
      render(<ReadingProgress />)

      expect(getElementByIdSpy).toHaveBeenCalledWith('article-content')
    })
  })

  describe('Progress Calculation Logic', () => {
    test('handles zero document height', async () => {
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 768,
        writable: true,
        configurable: true,
      })
      const { container } = render(<ReadingProgress targetId="article-content" />)
      await act(async () => {})
      expect(container.firstChild).toBeNull()
    })

    test('handles missing target element gracefully', async () => {
      const { container } = render(<ReadingProgress targetId="nonexistent" />)
      await act(async () => {})
      expect(container.firstChild).toBeNull()
    })
  })
})