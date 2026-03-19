import { render, screen } from '@testing-library/react'
import ReadingProgress from '@/components/ui/ReadingProgress'

describe('ReadingProgress Component', () => {
  describe('Rendering', () => {
    test('renders null when at top of page', () => {
      Object.defineProperty(window, 'scrollY', { value: 0, writable: true })
      Object.defineProperty(window, 'innerHeight', { value: 1000, writable: true })
      Object.defineProperty(document.documentElement, 'scrollHeight', { value: 3000, writable: true })
      
      const { container } = render(<ReadingProgress />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Cleanup', () => {
    test('unmounts without errors', () => {
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true })
      Object.defineProperty(window, 'innerHeight', { value: 1000, writable: true })
      Object.defineProperty(document.documentElement, 'scrollHeight', { value: 3000, writable: true })
      
      const { unmount } = render(<ReadingProgress />)
      expect(() => unmount()).not.toThrow()
    })
  })

  describe('Edge Cases', () => {
    test('handles viewport larger than document (no scroll)', () => {
      Object.defineProperty(window, 'scrollY', { value: 0, writable: true })
      Object.defineProperty(window, 'innerHeight', { value: 5000, writable: true })
      Object.defineProperty(document.documentElement, 'scrollHeight', { value: 3000, writable: true })
      
      const { container } = render(<ReadingProgress />)
      expect(container.firstChild).toBeNull()
    })

    test('renders with custom target id', () => {
      Object.defineProperty(window, 'scrollY', { value: 0, writable: true })
      Object.defineProperty(window, 'innerHeight', { value: 1000, writable: true })
      Object.defineProperty(document.documentElement, 'scrollHeight', { value: 3000, writable: true })
      
      const element = document.createElement('div')
      element.id = 'my-article'
      document.body.appendChild(element)
      
      const { container } = render(<ReadingProgress targetId="my-article" />)
      expect(container.firstChild).toBeNull()
      
      document.body.removeChild(element)
    })

    test('handles default target id', () => {
      Object.defineProperty(window, 'scrollY', { value: 0, writable: true })
      Object.defineProperty(window, 'innerHeight', { value: 1000, writable: true })
      Object.defineProperty(document.documentElement, 'scrollHeight', { value: 3000, writable: true })
      
      const element = document.createElement('div')
      element.id = 'article-content'
      document.body.appendChild(element)
      
      const { container } = render(<ReadingProgress />)
      expect(container.firstChild).toBeNull()
      
      document.body.removeChild(element)
    })
  })

  describe('Component Structure', () => {
    test('component renders without errors', () => {
      const { baseElement } = render(<ReadingProgress />)
      expect(baseElement).toBeTruthy()
    })
  })
})