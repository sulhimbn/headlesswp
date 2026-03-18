import { render } from '@testing-library/react'
import ReadingProgress from '@/components/ui/ReadingProgress'

describe('ReadingProgress Component', () => {
  let originalScrollY: number
  let originalInnerHeight: number

  beforeEach(() => {
    jest.useFakeTimers()
    originalScrollY = window.scrollY
    originalInnerHeight = window.innerHeight
    
    Object.defineProperty(window, 'scrollY', { 
      value: 0, 
      writable: true,
      configurable: true 
    })
    Object.defineProperty(window, 'innerHeight', { 
      value: 768, 
      writable: true,
      configurable: true 
    })
    Object.defineProperty(document.documentElement, 'scrollHeight', { 
      value: 2000, 
      writable: true,
      configurable: true 
    })
  })

  afterEach(() => {
    jest.useRealTimers()
    Object.defineProperty(window, 'scrollY', { value: originalScrollY })
    Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight })
  })

  describe('Hidden State', () => {
    test('returns null when progress is 0', () => {
      Object.defineProperty(window, 'scrollY', { value: 0 })
      const { container } = render(<ReadingProgress />)
      expect(container.firstChild).toBeNull()
    })

    test('returns null when progress is negative', () => {
      Object.defineProperty(window, 'scrollY', { value: -100 })
      const { container } = render(<ReadingProgress />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Memoization', () => {
    test('component is exported as memoized', () => {
      const readingProgress = require('@/components/ui/ReadingProgress').default
      expect(readingProgress.type).toBeDefined()
    })
  })
})