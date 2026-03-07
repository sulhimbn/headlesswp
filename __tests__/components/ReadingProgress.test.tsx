import { render, screen, fireEvent } from '@testing-library/react'
import ReadingProgress from '@/components/ui/ReadingProgress'
import React from 'react'

describe('ReadingProgress Component', () => {
  const originalScrollY = window.scrollY
  const originalInnerHeight = window.innerHeight
  const originalScrollHeight = document.documentElement.scrollHeight

  beforeEach(() => {
    jest.useFakeTimers()
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true })
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, configurable: true })
    
    const targetElement = document.createElement('div')
    targetElement.id = 'article-content'
    document.body.appendChild(targetElement)
  })

  afterEach(() => {
    jest.useRealTimers()
    window.scrollY = originalScrollY
    window.innerHeight = originalInnerHeight
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: originalScrollHeight, configurable: true })
    
    const targetElement = document.getElementById('article-content')
    if (targetElement) {
      document.body.removeChild(targetElement)
    }
    
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    test('renders progress bar when scrolled', () => {
      Object.defineProperty(window, 'scrollY', { value: 500 })
      
      render(<ReadingProgress />)
      jest.runAllTimers()
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    test('does not render when progress is 0', () => {
      Object.defineProperty(window, 'scrollY', { value: 0 })
      
      const { container } = render(<ReadingProgress />)
      jest.runAllTimers()
      
      expect(container.firstChild).toBeNull()
    })

    test('renders progress bar with correct aria attributes', () => {
      Object.defineProperty(window, 'scrollY', { value: 500 })
      
      render(<ReadingProgress />)
      jest.runAllTimers()
      
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-valuemin', '0')
      expect(progressbar).toHaveAttribute('aria-valuemax', '100')
      expect(progressbar).toHaveAttribute('aria-label', 'Kemajuan membaca')
    })
  })

  describe('Progress Calculation', () => {
    test('calculates progress correctly based on scroll position', () => {
      Object.defineProperty(window, 'scrollY', { value: 640, writable: true })
      
      render(<ReadingProgress />)
      jest.runAllTimers()
      
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-valuenow', '52')
    })

    test('caps progress at 100%', () => {
      Object.defineProperty(window, 'scrollY', { value: 2000 })
      
      render(<ReadingProgress />)
      jest.runAllTimers()
      
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-valuenow', '100')
    })

    test('uses custom targetId when provided', () => {
      const customTarget = document.createElement('div')
      customTarget.id = 'custom-content'
      document.body.appendChild(customTarget)
      
      Object.defineProperty(window, 'scrollY', { value: 500 })
      
      render(<ReadingProgress targetId="custom-content" />)
      jest.runAllTimers()
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
      
      document.body.removeChild(customTarget)
    })

    test('handles missing target element', () => {
      const targetElement = document.getElementById('article-content')
      if (targetElement) {
        document.body.removeChild(targetElement)
      }
      
      Object.defineProperty(window, 'scrollY', { value: 500 })
      
      const { container } = render(<ReadingProgress />)
      jest.runAllTimers()
      
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Progress Updates on Scroll', () => {
    test('updates progress when scroll event fires', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
      
      Object.defineProperty(window, 'scrollY', { value: 0, writable: true })
      render(<ReadingProgress />)
      
      expect(addEventListenerSpy).toHaveBeenCalledTimes(2)
      expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true })
      
      addEventListenerSpy.mockRestore()
    })

    test('responds to resize events', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
      
      render(<ReadingProgress />)
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function), { passive: true })
      
      addEventListenerSpy.mockRestore()
    })
  })

  describe('Cleanup on Unmount', () => {
    test('removes event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
      
      Object.defineProperty(window, 'scrollY', { value: 500 })
      
      const { unmount } = render(<ReadingProgress />)
      jest.runAllTimers()
      
      unmount()
      
      expect(removeEventListenerSpy).toHaveBeenCalledTimes(2)
      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    })

    test('does not throw when unmounting with no scroll', () => {
      const { unmount } = render(<ReadingProgress />)
      jest.runAllTimers()
      
      expect(() => unmount()).not.toThrow()
    })
  })

  describe('Component Properties', () => {
    test('has correct CSS classes for styling', () => {
      Object.defineProperty(window, 'scrollY', { value: 500 })
      
      const { container } = render(<ReadingProgress />)
      jest.runAllTimers()
      
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('fixed', 'top-0', 'left-0', 'right-0', 'z-50', 'h-1', 'bg-transparent')
    })

    test('progress bar has transition class', () => {
      Object.defineProperty(window, 'scrollY', { value: 500 })
      
      const { container } = render(<ReadingProgress />)
      jest.runAllTimers()
      
      const progressBar = container.querySelector('.transition-all')
      expect(progressBar).toBeInTheDocument()
    })

    test('uses design token for background color', () => {
      Object.defineProperty(window, 'scrollY', { value: 500 })
      
      const { container } = render(<ReadingProgress />)
      jest.runAllTimers()
      
      const progressBar = container.firstChild?.firstChild as HTMLElement
      expect(progressBar).toHaveClass('bg-[hsl(var(--color-primary))]')
    })
  })

  describe('Edge Cases', () => {
    test('handles zero document height', () => {
      Object.defineProperty(document.documentElement, 'scrollHeight', { value: 768 })
      
      const { container } = render(<ReadingProgress />)
      jest.runAllTimers()
      
      expect(container.firstChild).toBeNull()
    })

    test('handles negative scroll position', () => {
      Object.defineProperty(window, 'scrollY', { value: -100 })
      
      const { container } = render(<ReadingProgress />)
      jest.runAllTimers()
      
      expect(container.firstChild).toBeNull()
    })
  })
})
