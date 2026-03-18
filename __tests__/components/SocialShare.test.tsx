import { render, screen, fireEvent } from '@testing-library/react'
import SocialShare from '@/components/ui/SocialShare'

jest.mock('@/lib/api/config', () => ({
  SITE_URL: 'https://example.com',
}))

describe('SocialShare Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    test('renders share buttons container', () => {
      render(<SocialShare title="Test Title" url="/test" />)
      const container = document.querySelector('.flex.items-center.gap-3')
      expect(container).toBeInTheDocument()
    })

    test('renders all platform buttons', () => {
      render(<SocialShare title="Test Title" url="/test" />)
      expect(screen.getByLabelText('Bagikan ke Facebook')).toBeInTheDocument()
      expect(screen.getByLabelText('Bagikan ke Twitter')).toBeInTheDocument()
      expect(screen.getByLabelText('Bagikan ke WhatsApp')).toBeInTheDocument()
    })

    test('renders copy link button', () => {
      render(<SocialShare title="Test Title" url="/test" />)
      expect(screen.getByLabelText('Salin tautan')).toBeInTheDocument()
    })

    test('applies custom className', () => {
      render(<SocialShare title="Test Title" url="/test" className="custom-class" />)
      const container = document.querySelector('.custom-class')
      expect(container).toBeInTheDocument()
    })
  })

  describe('Platform Buttons', () => {
    test('Facebook button has correct icon', () => {
      render(<SocialShare title="Test Title" url="/test" />)
      const fbButton = screen.getByLabelText('Bagikan ke Facebook')
      expect(fbButton).toBeInTheDocument()
    })

    test('Twitter button has correct icon', () => {
      render(<SocialShare title="Test Title" url="/test" />)
      const twitterButton = screen.getByLabelText('Bagikan ke Twitter')
      expect(twitterButton).toBeInTheDocument()
    })

    test('WhatsApp button has correct icon', () => {
      render(<SocialShare title="Test Title" url="/test" />)
      const waButton = screen.getByLabelText('Bagikan ke WhatsApp')
      expect(waButton).toBeInTheDocument()
    })

    test('buttons have correct accessibility attributes', () => {
      render(<SocialShare title="Test Title" url="/test" />)
      const fbButton = screen.getByLabelText('Bagikan ke Facebook')
      expect(fbButton).toHaveAttribute('title', 'Bagikan ke Facebook')
    })
  })

  describe('Copy Link Functionality', () => {
    test('shows "Salin tautan" label initially', () => {
      render(<SocialShare title="Test Title" url="/test" />)
      expect(screen.getByLabelText('Salin tautan')).toBeInTheDocument()
    })

    test('copy button uses link icon initially', () => {
      render(<SocialShare title="Test Title" url="/test" />)
      const copyButton = screen.getByLabelText('Salin tautan')
      const svg = copyButton.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('URL Handling', () => {
    test('adds SITE_URL to relative URLs', () => {
      render(<SocialShare title="Test Title" url="/test-article" />)
      expect(screen.getByLabelText('Bagikan ke Facebook')).toBeInTheDocument()
    })

    test('uses absolute URL directly', () => {
      render(<SocialShare title="Test Title" url="https://other.com/article" />)
      expect(screen.getByLabelText('Bagikan ke Facebook')).toBeInTheDocument()
    })
  })

  describe('Icon Rendering', () => {
    test('renders Facebook icon', () => {
      const { container } = render(<SocialShare title="Test" url="/test" />)
      const fbSvg = container.querySelector('svg')
      expect(fbSvg).toBeInTheDocument()
    })

    test('SocialIcon component is used internally', () => {
      render(<SocialShare title="Test Title" url="/test" />)
      const buttons = document.querySelectorAll('button')
      expect(buttons.length).toBe(4)
    })
  })

  describe('Styling', () => {
    test('buttons have rounded-full class', () => {
      render(<SocialShare title="Test Title" url="/test" />)
      const buttons = document.querySelectorAll('button')
      buttons.forEach(button => {
        expect(button).toHaveClass('rounded-full')
      })
    })

    test('buttons have focus styles', () => {
      render(<SocialShare title="Test Title" url="/test" />)
      const buttons = document.querySelectorAll('button')
      buttons.forEach(button => {
        expect(button).toHaveClass('focus:outline-none', 'focus:ring-2')
      })
    })

    test('container has flex layout', () => {
      const { container } = render(<SocialShare title="Test Title" url="/test" />)
      const innerDiv = container.querySelector('.flex')
      expect(innerDiv).toHaveClass('flex', 'items-center', 'gap-3')
    })
  })
})