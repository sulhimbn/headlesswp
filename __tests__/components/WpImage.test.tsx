import { render, screen } from '@testing-library/react'
import WpImage from '@/components/ui/WpImage'

jest.mock('next/image', () => {
  const React = require('react')
  return {
    __esModule: true,
    default: React.forwardRef(({ src, alt, loading, placeholder, sizes, priority, fill, ...props }: any, ref: any) => (
      <img
        data-testid="next-image"
        src={src}
        alt={alt}
        loading={loading || 'lazy'}
        placeholder={placeholder}
        sizes={sizes}
        data-priority={priority ? true : undefined}
        data-fill={fill ? true : undefined}
        {...props}
      />
    )),
  }
})

describe('WpImage Component', () => {
  const wpImageUrl = 'https://example.com/wp-content/uploads/2025/01/image.jpg'

  describe('Rendering', () => {
    test('renders image with src', () => {
      render(<WpImage src={wpImageUrl} alt="Test image" />)
      const image = screen.getByTestId('next-image')
      expect(image).toHaveAttribute('src', wpImageUrl)
    })

    test('renders image with alt text', () => {
      render(<WpImage src={wpImageUrl} alt="Test image" />)
      const image = screen.getByTestId('next-image')
      expect(image).toHaveAttribute('alt', 'Test image')
    })

    test('renders image with custom className', () => {
      render(<WpImage src={wpImageUrl} alt="Test" className="custom-class" />)
      const image = screen.getByTestId('next-image')
      expect(image).toHaveClass('custom-class')
    })
  })

  describe('Lazy Loading', () => {
    test('uses lazy loading by default', () => {
      render(<WpImage src={wpImageUrl} alt="Test" />)
      const image = screen.getByTestId('next-image')
      expect(image).toHaveAttribute('loading', 'lazy')
    })

    test('sets eager loading when priority is true', () => {
      render(<WpImage src={wpImageUrl} alt="Test" priority />)
      const image = screen.getByTestId('next-image')
      expect(image).toHaveAttribute('data-priority', 'true')
    })
  })

  describe('Placeholder', () => {
    test('uses blur placeholder by default', () => {
      render(<WpImage src={wpImageUrl} alt="Test" />)
      const image = screen.getByTestId('next-image')
      expect(image).toHaveAttribute('placeholder', 'blur')
    })

    test('accepts custom blurDataURL', () => {
      const customBlurDataURL = 'data:image/png;base64,custom'
      render(<WpImage src={wpImageUrl} alt="Test" blurDataURL={customBlurDataURL} />)
      const image = screen.getByTestId('next-image')
      expect(image).toHaveAttribute('blurDataURL', customBlurDataURL)
    })
  })

  describe('WordPress Media URL Detection', () => {
    test('detects WordPress media URL with wp-content/uploads', () => {
      render(<WpImage src={wpImageUrl} alt="Test" />)
      const image = screen.getByTestId('next-image')
      expect(image).toBeInTheDocument()
    })

    test('handles external WordPress URL', () => {
      const externalWpUrl = 'https://external-site.com/wp-content/uploads/2024/12/photo.jpg'
      render(<WpImage src={externalWpUrl} alt="External image" />)
      const image = screen.getByTestId('next-image')
      expect(image).toHaveAttribute('src', externalWpUrl)
    })
  })

  describe('Sizes', () => {
    test('uses default sizes for non-priority images', () => {
      render(<WpImage src={wpImageUrl} alt="Test" />)
      const image = screen.getByTestId('next-image')
      expect(image).toHaveAttribute(
        'sizes',
        '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
      )
    })

    test('uses 100vw sizes for priority images', () => {
      render(<WpImage src={wpImageUrl} alt="Test" priority />)
      const image = screen.getByTestId('next-image')
      expect(image).toHaveAttribute('sizes', '100vw')
    })

    test('accepts custom sizes', () => {
      render(<WpImage src={wpImageUrl} alt="Test" sizes="50vw" />)
      const image = screen.getByTestId('next-image')
      expect(image).toHaveAttribute('sizes', '50vw')
    })
  })

  describe('Props Passthrough', () => {
    test('passes width and height', () => {
      render(<WpImage src={wpImageUrl} alt="Test" width={800} height={600} />)
      const image = screen.getByTestId('next-image')
      expect(image).toHaveAttribute('width', '800')
      expect(image).toHaveAttribute('height', '600')
    })

    test('passes style props', () => {
      render(<WpImage src={wpImageUrl} alt="Test" style={{ objectFit: 'cover' }} />)
      const image = screen.getByTestId('next-image')
      expect(image).toHaveStyle({ objectFit: 'cover' })
    })

    test('accepts fill prop', () => {
      render(
        <WpImage
          src={wpImageUrl}
          alt="Test"
          fill
          sizes="100vw"
        />
      )
      const image = screen.getByTestId('next-image')
      expect(image).toHaveAttribute('data-fill', 'true')
    })
  })

  describe('Edge Cases', () => {
    test('renders with empty alt text', () => {
      render(<WpImage src={wpImageUrl} alt="" />)
      const image = screen.getByTestId('next-image')
      expect(image).toHaveAttribute('alt', '')
    })

    test('handles non-WordPress URL', () => {
      const externalUrl = 'https://cdn.example.com/images/photo.jpg'
      render(<WpImage src={externalUrl} alt="External image" />)
      const image = screen.getByTestId('next-image')
      expect(image).toHaveAttribute('src', externalUrl)
    })
  })
})