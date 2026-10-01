import { render, screen } from '@testing-library/react'
import Media from '@/components/ui/Media'

jest.mock('next/image', () => {
  return function MockImage(props: any) {
    return (
      <img
        src={props.src}
        alt={props.alt}
        data-priority={props.priority}
        data-placeholder={props.placeholder}
        className={props.className}
        sizes={props.sizes}
        {...props}
      />
    )
  }
})

describe('Media Component', () => {
  describe('Basic Rendering', () => {
    it('renders with valid image URL', () => {
      render(<Media src="https://example.com/image.jpg" alt="Test image" />)
      const img = screen.getByRole('img')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', 'https://example.com/image.jpg')
      expect(img).toHaveAttribute('alt', 'Test image')
    })

    it('renders with null src using placeholder', () => {
      render(<Media src={null} alt="Test image" />)
      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('src', '/placeholder-image.jpg')
    })

    it('renders with undefined src using placeholder', () => {
      render(<Media src={undefined} alt="Test image" />)
      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('src', '/placeholder-image.jpg')
    })
  })

  describe('Lazy Loading', () => {
    it('applies lazy loading (priority=false) for auto priority', () => {
      render(<Media src="https://example.com/image.jpg" alt="Test" priority="auto" />)
      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('data-priority', 'false')
    })

    it('applies priority loading for high priority', () => {
      render(<Media src="https://example.com/image.jpg" alt="Test" priority="high" />)
      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('data-priority', 'true')
    })

    it('applies lazy loading for low priority', () => {
      render(<Media src="https://example.com/image.jpg" alt="Test" priority="low" />)
      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('data-priority', 'false')
    })
  })

  describe('Blur Placeholder', () => {
    it('applies blur placeholder for valid URLs with showBlur enabled', () => {
      render(<Media src="https://example.com/image.jpg" alt="Test" showBlur={true} />)
      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('data-placeholder', 'blur')
    })

    it('does not apply blur placeholder for null src', () => {
      render(<Media src={null} alt="Test" showBlur={true} />)
      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('data-placeholder', 'empty')
    })

    it('does not apply blur when showBlur is false', () => {
      render(<Media src="https://example.com/image.jpg" alt="Test" showBlur={false} />)
      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('data-placeholder', 'empty')
    })
  })

  describe('Responsive Sizes', () => {
    it('uses filled sizes by default', () => {
      render(<Media src="https://example.com/image.jpg" alt="Test" />)
      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('sizes', '(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 100vw')
    })

    it('uses card sizes for variant=card', () => {
      render(<Media src="https://example.com/image.jpg" alt="Test" variant="card" />)
      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('sizes', '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw')
    })

    it('uses thumbnail sizes for variant=thumbnail', () => {
      render(<Media src="https://example.com/image.jpg" alt="Test" variant="thumbnail" />)
      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('sizes', '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw')
    })

    it('uses custom sizes when provided', () => {
      render(<Media src="https://example.com/image.jpg" alt="Test" sizes="50vw" />)
      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('sizes', '50vw')
    })
  })

  describe('CSS Classes', () => {
    it('applies custom className', () => {
      render(<Media src="https://example.com/image.jpg" alt="Test" className="custom-class" />)
      const img = screen.getByRole('img')
      expect(img).toHaveClass('custom-class')
    })
  })
})
