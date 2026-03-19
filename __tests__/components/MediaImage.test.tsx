import { render, screen } from '@testing-library/react'
import { MediaImage, DEFAULT_SIZES } from '@/components/ui/MediaImage'

describe('MediaImage Component', () => {
  describe('Rendering', () => {
    test('renders img element for non-WordPress URLs', () => {
      render(<MediaImage src="https://example.com/image.jpg" alt="Test image" />)
      const img = screen.getByRole('img')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', 'https://example.com/image.jpg')
      expect(img).toHaveAttribute('alt', 'Test image')
    })

    test('renders with custom className', () => {
      render(<MediaImage src="https://example.com/image.jpg" alt="Test" className="custom-class" />)
      const img = screen.getByRole('img')
      expect(img).toHaveClass('custom-class')
    })
  })

  describe('Lazy Loading', () => {
    test('applies lazy loading to non-priority images', () => {
      render(<MediaImage src="https://example.com/image.jpg" alt="Test" priority={false} />)
      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('loading', 'lazy')
      expect(img).toHaveAttribute('decoding', 'async')
    })

    test('applies eager loading to priority images', () => {
      render(<MediaImage src="https://example.com/image.jpg" alt="Test" priority={true} />)
      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('loading', 'eager')
      expect(img).toHaveAttribute('decoding', 'sync')
    })
  })

  describe('Default Props', () => {
    test('uses placeholder when src is empty', () => {
      render(<MediaImage src="" alt="Test" />)
      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('src', '/placeholder-image.jpg')
    })

    test('uses default alt text when not provided', () => {
      const { container } = render(<MediaImage src="https://example.com/image.jpg" />)
      const img = container.querySelector('img')
      expect(img).toHaveAttribute('alt', '')
    })
  })

  describe('DEFAULT_SIZES', () => {
    test('exports correct size presets', () => {
      expect(DEFAULT_SIZES.thumbnail).toBe('(max-width: 640px) 100vw, 25vw')
      expect(DEFAULT_SIZES.card).toBe('(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw')
      expect(DEFAULT_SIZES.hero).toBe('100vw')
      expect(DEFAULT_SIZES.content).toBe('(max-width: 768px) 100vw, 700px')
      expect(DEFAULT_SIZES.avatar).toBe('64px')
    })
  })

  describe('Memoization', () => {
    test('renders the same component for identical props', () => {
      const { container, rerender } = render(<MediaImage src="https://example.com/test.jpg" alt="Test" />)
      const firstRender = container.innerHTML
      
      rerender(<MediaImage src="https://example.com/test.jpg" alt="Test" />)
      const secondRender = container.innerHTML
      
      expect(firstRender).toBe(secondRender)
    })
  })
})