import { render, screen } from '@testing-library/react'
import WordPressImage from '@/components/ui/WordPressImage'
import type { WordPressMedia } from '@/types/wordpress'
import React from 'react'

jest.mock('next/image', () => {
  return function MockImage(props: React.ComponentProps<'img'> & { priority?: boolean; fill?: boolean; sizes?: string }) {
    const { priority, fill, sizes, ...imgProps } = props
    return <img {...imgProps} data-testid="next-image" />
  }
})

describe('WordPressImage Component', () => {
  const mockMediaUrl = 'https://example.com/wp-content/uploads/2026/01/image.jpg'
  
  const mockMediaObject: WordPressMedia = {
    id: 1,
    source_url: 'https://example.com/wp-content/uploads/2026/01/image.jpg',
    title: { rendered: 'Test Image' },
    alt_text: 'Test Alt Text',
    media_type: 'image',
    mime_type: 'image/jpeg',
    media_details: {
      width: 1200,
      height: 800,
      file: '2026/01/image.jpg',
      sizes: {
        medium: {
          source_url: 'https://example.com/wp-content/uploads/2026/01/image-300x200.jpg',
          width: 300,
          height: 200,
          file: '2026/01/image-300x200.jpg',
          mime_type: 'image/jpeg',
        },
        large: {
          source_url: 'https://example.com/wp-content/uploads/2026/01/image-1024x683.jpg',
          width: 1024,
          height: 683,
          file: '2026/01/image-1024x683.jpg',
          mime_type: 'image/jpeg',
        },
        full: {
          source_url: 'https://example.com/wp-content/uploads/2026/01/image.jpg',
          width: 1200,
          height: 800,
          file: '2026/01/image.jpg',
          mime_type: 'image/jpeg',
        },
      },
    },
  }

  describe('Rendering', () => {
    test('renders null when media is null', () => {
      const { container } = render(<WordPressImage media={null} />)
      const img = container.querySelector('img')
      expect(img).not.toBeInTheDocument()
    })

    test('renders null when media is undefined', () => {
      const { container } = render(<WordPressImage media={undefined} />)
      const img = container.querySelector('img')
      expect(img).not.toBeInTheDocument()
    })

    test('renders image when media is a URL string', () => {
      render(<WordPressImage media={mockMediaUrl} alt="Test Image" />)
      const image = screen.getByTestId('next-image')
      expect(image).toBeInTheDocument()
    })

    test('renders image when media is a WordPress media object', () => {
      render(<WordPressImage media={mockMediaObject} />)
      const image = screen.getByTestId('next-image')
      expect(image).toBeInTheDocument()
    })
  })

  describe('URL Handling', () => {
    test('uses source_url from media object', () => {
      render(<WordPressImage media={mockMediaObject} />)
      const image = screen.getByTestId('next-image')
      expect(image).toHaveAttribute('src', mockMediaObject.source_url)
    })

    test('uses string URL directly when provided', () => {
      render(<WordPressImage media={mockMediaUrl} />)
      const image = screen.getByTestId('next-image')
      expect(image).toHaveAttribute('src', mockMediaUrl)
    })

    test('returns null when source_url is empty in media object', () => {
      const mediaWithoutUrl = { ...mockMediaObject, source_url: '' }
      const { container } = render(<WordPressImage media={mediaWithoutUrl} />)
      const img = container.querySelector('img')
      expect(img).not.toBeInTheDocument()
    })
  })

  describe('Alt Text', () => {
    test('uses alt_text from media object', () => {
      render(<WordPressImage media={mockMediaObject} />)
      const image = screen.getByTestId('next-image')
      expect(image).toHaveAttribute('alt', 'Test Alt Text')
    })

    test('uses title.rendered when alt_text is empty', () => {
      const mediaWithoutAlt = { ...mockMediaObject, alt_text: '' }
      render(<WordPressImage media={mediaWithoutAlt} />)
      const image = screen.getByTestId('next-image')
      expect(image).toHaveAttribute('alt', 'Test Image')
    })

    test('uses provided alt prop as fallback', () => {
      render(<WordPressImage media={mockMediaUrl} alt="Custom Alt" />)
      const image = screen.getByTestId('next-image')
      expect(image).toHaveAttribute('alt', 'Custom Alt')
    })
  })

  describe('Dimensions', () => {
    test('extracts width from media_details when using fill', () => {
      render(<WordPressImage media={mockMediaObject} fill />)
      const image = screen.getByTestId('next-image')
      expect(image).toHaveAttribute('src', expect.stringContaining('image.jpg'))
    })

    test('extracts height from media_details when using fill', () => {
      render(<WordPressImage media={mockMediaObject} fill />)
      const image = screen.getByTestId('next-image')
      expect(image).toHaveAttribute('src', expect.stringContaining('image.jpg'))
    })

    test('uses provided width over media_details', () => {
      render(<WordPressImage media={mockMediaObject} width={500} height={300} />)
      const image = screen.getByTestId('next-image')
      expect(image).toHaveAttribute('width', '500')
      expect(image).toHaveAttribute('height', '300')
    })

    test('uses explicit width/height when not using fill', () => {
      render(<WordPressImage media={mockMediaObject} />)
      const image = screen.getByTestId('next-image')
      expect(image).toHaveAttribute('width', '1200')
      expect(image).toHaveAttribute('height', '800')
    })
  })

  describe('Priority', () => {
    test('renders with priority prop when provided', () => {
      render(<WordPressImage media={mockMediaUrl} priority />)
      const image = screen.getByTestId('next-image')
      expect(image).toBeInTheDocument()
    })

    test('renders without priority by default', () => {
      render(<WordPressImage media={mockMediaUrl} />)
      const image = screen.getByTestId('next-image')
      expect(image).toBeInTheDocument()
    })
  })

  describe('Sizes', () => {
    test('renders image with sizes attribute when media object provided', () => {
      render(<WordPressImage media={mockMediaObject} />)
      const image = screen.getByTestId('next-image')
      expect(image).toBeInTheDocument()
    })

    test('renders image with custom sizes when provided', () => {
      render(<WordPressImage media={mockMediaObject} sizes="50vw" />)
      const image = screen.getByTestId('next-image')
      expect(image).toBeInTheDocument()
    })
  })

  describe('ClassName and Style', () => {
    test('applies className', () => {
      render(<WordPressImage media={mockMediaUrl} className="custom-class" />)
      const image = screen.getByTestId('next-image')
      expect(image).toHaveClass('custom-class')
    })

    test('applies style', () => {
      render(<WordPressImage media={mockMediaUrl} style={{ objectFit: 'cover' }} />)
      const image = screen.getByTestId('next-image')
      expect(image).toHaveStyle({ objectFit: 'cover' })
    })
  })

  describe('Media without details', () => {
    test('handles media object without media_details', () => {
      const mediaWithoutDetails: WordPressMedia = {
        id: 2,
        source_url: 'https://example.com/image2.jpg',
        title: { rendered: 'Image 2' },
        alt_text: 'Alt 2',
        media_type: 'image',
        mime_type: 'image/jpeg',
      }
      render(<WordPressImage media={mediaWithoutDetails} width={100} height={100} />)
      const image = screen.getByTestId('next-image')
      expect(image).toHaveAttribute('src', 'https://example.com/image2.jpg')
      expect(image).toHaveAttribute('width', '100')
    })
  })

  describe('Memoization', () => {
    test('re-renders when media changes', () => {
      const { rerender, getByTestId } = render(<WordPressImage media={mockMediaUrl} />)
      
      expect(getByTestId('next-image')).toHaveAttribute('src', mockMediaUrl)
      
      rerender(<WordPressImage media="https://example.com/other.jpg" />)
      
      expect(getByTestId('next-image')).toHaveAttribute('src', 'https://example.com/other.jpg')
    })

    test('re-renders when alt prop changes', () => {
      const { rerender, getByTestId } = render(<WordPressImage media={mockMediaUrl} alt="Alt 1" />)
      
      expect(getByTestId('next-image')).toHaveAttribute('alt', 'Alt 1')
      
      rerender(<WordPressImage media={mockMediaUrl} alt="Alt 2" />)
      
      expect(getByTestId('next-image')).toHaveAttribute('alt', 'Alt 2')
    })

    test('re-renders when priority changes', () => {
      const { rerender, getByTestId } = render(<WordPressImage media={mockMediaUrl} priority={false} />)
      
      expect(getByTestId('next-image')).toBeInTheDocument()
      
      rerender(<WordPressImage media={mockMediaUrl} priority />)
      
      expect(getByTestId('next-image')).toBeInTheDocument()
    })
  })
})
