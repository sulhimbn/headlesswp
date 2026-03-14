import { render, screen, act, waitFor } from '@testing-library/react'
import ReadingProgress from '@/components/ui/ReadingProgress'

describe('ReadingProgress Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true, configurable: true })
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, writable: true, configurable: true })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Rendering', () => {
    test('returns null when scroll position is 0', () => {
      Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true })
      
      const { container } = render(<ReadingProgress />)
      expect(container.firstChild).toBeNull()
    })

    test('returns null when progress is negative', () => {
      Object.defineProperty(window, 'scrollY', { value: -100, writable: true, configurable: true })
      
      const { container } = render(<ReadingProgress />)
      expect(container.firstChild).toBeNull()
    })

    test('returns null when target element is not found', () => {
      jest.spyOn(document, 'getElementById').mockReturnValue(null)
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true, configurable: true })
      
      const { container } = render(<ReadingProgress />)
      expect(container.firstChild).toBeNull()
    })

    test('handles small document height', () => {
      Object.defineProperty(window, 'scrollY', { value: 100, writable: true, configurable: true })
      Object.defineProperty(window, 'innerHeight', { value: 1000, writable: true, configurable: true })
      Object.defineProperty(document.documentElement, 'scrollHeight', { value: 1000, writable: true, configurable: true })
      
      const { container } = render(<ReadingProgress />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Component behavior', () => {
    test('adds event listeners on mount', () => {
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true, configurable: true })
      
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
      render(<ReadingProgress />)
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true })
      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function), { passive: true })
    })

    test('removes event listeners on unmount', () => {
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true, configurable: true })
      
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
      const { unmount } = render(<ReadingProgress />)
      unmount()
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    })

    test('uses default targetId when not provided', () => {
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true, configurable: true })
      
      const getElementByIdSpy = jest.spyOn(document, 'getElementById').mockReturnValue(null)
      render(<ReadingProgress />)
      
      expect(getElementByIdSpy).toHaveBeenCalledWith('article-content')
    })

    test('uses custom targetId when provided', () => {
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true, configurable: true })
      
      const getElementByIdSpy = jest.spyOn(document, 'getElementById').mockReturnValue(null)
      render(<ReadingProgress targetId="custom-content" />)
      
      expect(getElementByIdSpy).toHaveBeenCalledWith('custom-content')
    })
  })
})
