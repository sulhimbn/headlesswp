import { render, screen, waitFor } from '@testing-library/react'
import ReadingProgress from '@/components/ui/ReadingProgress'

describe('ReadingProgress Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true })
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, writable: true })
    
    const existing = document.getElementById('article-content')
    if (existing) existing.remove()
  })

  afterEach(() => {
    const el = document.getElementById('article-content')
    if (el) el.remove()
  })

  describe('Rendering', () => {
    test('renders nothing when progress is 0', () => {
      const { container } = render(<ReadingProgress />)
      expect(container.firstChild).toBeNull()
    })

    test('renders progress bar when progress is greater than 0', async () => {
      const mockElement = document.createElement('div')
      mockElement.id = 'article-content'
      document.body.appendChild(mockElement)

      Object.defineProperty(window, 'scrollY', { value: 500, writable: true })

      const { container } = render(<ReadingProgress />)
      
      await waitFor(() => {
        expect(container.firstChild).not.toBeNull()
      })
      
      document.body.removeChild(mockElement)
    })
  })

  describe('Props', () => {
    test('accepts custom targetId', async () => {
      const mockElement = document.createElement('div')
      mockElement.id = 'custom-content'
      document.body.appendChild(mockElement)

      const { container } = render(<ReadingProgress targetId="custom-content" />)
      
      expect(container.firstChild).toBeNull()
      
      document.body.removeChild(mockElement)
    })

    test('does not require target element to exist', () => {
      const { container } = render(<ReadingProgress targetId="non-existent" />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Accessibility', () => {
    test('has proper role when rendered', async () => {
      const mockElement = document.createElement('div')
      mockElement.id = 'article-content'
      document.body.appendChild(mockElement)

      Object.defineProperty(window, 'scrollY', { value: 500, writable: true })

      render(<ReadingProgress />)
      
      await waitFor(() => {
        const progressbar = screen.getByRole('progressbar')
        expect(progressbar).toHaveAttribute('aria-valuemin', '0')
        expect(progressbar).toHaveAttribute('aria-valuemax', '100')
        expect(progressbar).toHaveAttribute('aria-label', 'Kemajuan membaca')
      })
      
      document.body.removeChild(mockElement)
    })

    test('aria-valuenow reflects current progress', async () => {
      const mockElement = document.createElement('div')
      mockElement.id = 'article-content'
      document.body.appendChild(mockElement)

      Object.defineProperty(window, 'scrollY', { value: 500, writable: true })

      render(<ReadingProgress />)
      
      await waitFor(() => {
        const progressbar = screen.getByRole('progressbar')
        const valuenow = parseInt(progressbar.getAttribute('aria-valuenow') || '0', 10)
        expect(valuenow).toBeGreaterThan(0)
        expect(valuenow).toBeLessThanOrEqual(100)
      })
      
      document.body.removeChild(mockElement)
    })
  })

  describe('Positioning', () => {
    test('is fixed at top of page', async () => {
      const mockElement = document.createElement('div')
      mockElement.id = 'article-content'
      document.body.appendChild(mockElement)

      Object.defineProperty(window, 'scrollY', { value: 500, writable: true })

      render(<ReadingProgress />)
      
      await waitFor(() => {
        const progressbar = screen.getByRole('progressbar')
        expect(progressbar).toHaveClass('fixed')
        expect(progressbar).toHaveClass('top-0')
        expect(progressbar).toHaveClass('left-0')
        expect(progressbar).toHaveClass('right-0')
        expect(progressbar).toHaveClass('z-50')
      })
      
      document.body.removeChild(mockElement)
    })
  })

  describe('Progress Bar', () => {
    test('has correct width style when scrolled', async () => {
      const mockElement = document.createElement('div')
      mockElement.id = 'article-content'
      document.body.appendChild(mockElement)

      Object.defineProperty(window, 'scrollY', { value: 750, writable: true })

      render(<ReadingProgress />)
      
      await waitFor(() => {
        const progressbar = screen.getByRole('progressbar')
        const progressFill = progressbar.firstChild as HTMLElement
        expect(progressFill.style.width).toContain('%')
      })
      
      document.body.removeChild(mockElement)
    })

    test('has primary color class', async () => {
      const mockElement = document.createElement('div')
      mockElement.id = 'article-content'
      document.body.appendChild(mockElement)

      Object.defineProperty(window, 'scrollY', { value: 500, writable: true })

      render(<ReadingProgress />)
      
      await waitFor(() => {
        const progressbar = screen.getByRole('progressbar')
        const progressFill = progressbar.firstChild as HTMLElement
        expect(progressFill).toHaveClass('bg-[hsl(var(--color-primary))]')
      })
      
      document.body.removeChild(mockElement)
    })
  })

  describe('Edge Cases', () => {
    test('handles zero document height', async () => {
      const mockElement = document.createElement('div')
      mockElement.id = 'article-content'
      document.body.appendChild(mockElement)

      Object.defineProperty(window, 'innerHeight', { value: 2000, writable: true })
      Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, writable: true })

      const { container } = render(<ReadingProgress />)
      expect(container.firstChild).toBeNull()
      
      document.body.removeChild(mockElement)
      Object.defineProperty(window, 'innerHeight', { value: 768, writable: true })
    })

    test('clamps progress at 100', async () => {
      const mockElement = document.createElement('div')
      mockElement.id = 'article-content'
      document.body.appendChild(mockElement)

      Object.defineProperty(window, 'scrollY', { value: 2000, writable: true })
      Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, writable: true })

      render(<ReadingProgress />)
      
      await waitFor(() => {
        const progressbar = screen.getByRole('progressbar')
        expect(progressbar).toHaveAttribute('aria-valuenow', '100')
      })
      
      document.body.removeChild(mockElement)
    })
  })

  describe('Height', () => {
    test('has height of 1', async () => {
      const mockElement = document.createElement('div')
      mockElement.id = 'article-content'
      document.body.appendChild(mockElement)

      Object.defineProperty(window, 'scrollY', { value: 500, writable: true })

      render(<ReadingProgress />)
      
      await waitFor(() => {
        const progressbar = screen.getByRole('progressbar')
        expect(progressbar).toHaveClass('h-1')
      })
      
      document.body.removeChild(mockElement)
    })
  })
})