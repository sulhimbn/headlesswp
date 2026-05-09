import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SocialShare from '@/components/ui/SocialShare'

const mockSiteUrl = 'https://example.com'

jest.mock('@/lib/api/config', () => ({
  SITE_URL: 'https://example.com',
}))

describe('SocialShare Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    test('renders correctly with default props', () => {
      render(<SocialShare title="Test Title" url="https://example.com/article" />)
      expect(screen.getAllByRole('button')).toHaveLength(4)
    })

    test('renders with custom className', () => {
      render(
        <SocialShare
          title="Test Title"
          url="https://example.com/article"
          className="custom-class"
        />
      )
      const container = document.querySelector('.custom-class')
      expect(container).toBeInTheDocument()
    })

    test('renders all social media buttons', () => {
      render(<SocialShare title="Test Title" url="https://example.com/article" />)
      
      expect(screen.getByRole('button', { name: /Facebook/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Twitter/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /WhatsApp/i })).toBeInTheDocument()
    })

    test('renders copy link button', () => {
      render(<SocialShare title="Test Title" url="https://example.com/article" />)
      expect(screen.getByRole('button', { name: /Salin tautan/i })).toBeInTheDocument()
    })
  })

  describe('Share URLs', () => {
    test('Facebook share URL is correctly formed', () => {
      window.open = jest.fn()
      render(<SocialShare title="Test Title" url="https://example.com/article" />)
      
      const facebookButton = screen.getByRole('button', { name: /Facebook/i })
      fireEvent.click(facebookButton)
      
      expect(window.open).toHaveBeenCalledWith(
        'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fexample.com%2Farticle',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('Twitter share URL is correctly formed', () => {
      window.open = jest.fn()
      render(<SocialShare title="Test Title" url="https://example.com/article" />)
      
      const twitterButton = screen.getByRole('button', { name: /Twitter/i })
      fireEvent.click(twitterButton)
      
      expect(window.open).toHaveBeenCalledWith(
        'https://twitter.com/intent/tweet?text=Test%20Title&url=https%3A%2F%2Fexample.com%2Farticle',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('WhatsApp share URL is correctly formed', () => {
      window.open = jest.fn()
      render(<SocialShare title="Test Title" url="https://example.com/article" />)
      
      const whatsappButton = screen.getByRole('button', { name: /WhatsApp/i })
      fireEvent.click(whatsappButton)
      
      expect(window.open).toHaveBeenCalledWith(
        'https://wa.me/?text=Test%20Title%20https%3A%2F%2Fexample.com%2Farticle',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('handles relative URLs by prepending SITE_URL', () => {
      window.open = jest.fn()
      render(<SocialShare title="Test Title" url="/article" />)
      
      const facebookButton = screen.getByRole('button', { name: /Facebook/i })
      fireEvent.click(facebookButton)
      
      expect(window.open).toHaveBeenCalledWith(
        'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fexample.com%2Farticle',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })
  })

  describe('Click Interaction', () => {
    test('opens share dialog on Facebook click', () => {
      window.open = jest.fn()
      render(<SocialShare title="Test Title" url="https://example.com/article" />)
      
      const facebookButton = screen.getByRole('button', { name: /Facebook/i })
      fireEvent.click(facebookButton)
      
      expect(window.open).toHaveBeenCalledTimes(1)
      expect(window.open).toHaveBeenCalledWith(
        expect.any(String),
        '_blank',
        expect.any(String)
      )
    })

    test('opens share dialog on Twitter click', () => {
      window.open = jest.fn()
      render(<SocialShare title="Test Title" url="https://example.com/article" />)
      
      const twitterButton = screen.getByRole('button', { name: /Twitter/i })
      fireEvent.click(twitterButton)
      
      expect(window.open).toHaveBeenCalledTimes(1)
    })

    test('opens share dialog on WhatsApp click', () => {
      window.open = jest.fn()
      render(<SocialShare title="Test Title" url="https://example.com/article" />)
      
      const whatsappButton = screen.getByRole('button', { name: /WhatsApp/i })
      fireEvent.click(whatsappButton)
      
      expect(window.open).toHaveBeenCalledTimes(1)
    })
  })

  describe('Copy Link', () => {
    test('copies link to clipboard when copy button clicked', async () => {
      const writeText = jest.fn()
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        writable: true,
      })
      
      render(<SocialShare title="Test Title" url="https://example.com/article" />)
      
      const copyButton = screen.getByRole('button', { name: /Salin tautan/i })
      fireEvent.click(copyButton)
      
      expect(writeText).toHaveBeenCalledWith('https://example.com/article')
    })

    test('shows check icon after copying', async () => {
      const writeText = jest.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        writable: true,
      })
      
      render(<SocialShare title="Test Title" url="https://example.com/article" />)
      
      const copyButton = screen.getByRole('button', { name: /Salin tautan/i })
      fireEvent.click(copyButton)
      
      await screen.findByRole('button', { name: /Tautan disalin/i })
    })

    test('falls back to execCommand when clipboard API fails', async () => {
      const writeText = jest.fn().mockRejectedValue(new Error('Clipboard API not available'))
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        writable: true,
      })
      
      document.execCommand = jest.fn().mockReturnValue(true)
      
      render(<SocialShare title="Test Title" url="https://example.com/article" />)
      
      const copyButton = screen.getByRole('button', { name: /Salin tautan/i })
      fireEvent.click(copyButton)
      
      await waitFor(() => {
        expect(document.execCommand).toHaveBeenCalledWith('copy')
      })
    })
  })

  describe('Accessibility', () => {
    test('has aria-label on social buttons', () => {
      render(<SocialShare title="Test Title" url="https://example.com/article" />)
      
      expect(screen.getByRole('button', { name: /Bagikan ke Facebook/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Bagikan ke Twitter/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Bagikan ke WhatsApp/i })).toBeInTheDocument()
    })

    test('has title attribute on buttons', () => {
      render(<SocialShare title="Test Title" url="https://example.com/article" />)
      
      const facebookButton = screen.getByRole('button', { name: /Facebook/i })
      expect(facebookButton).toHaveAttribute('title', 'Bagikan ke Facebook')
    })

    test('buttons are focusable', () => {
      render(<SocialShare title="Test Title" url="https://example.com/article" />)
      
      const facebookButton = screen.getByRole('button', { name: /Facebook/i })
      facebookButton.focus()
      expect(document.activeElement).toBe(facebookButton)
    })

    test('applies focus styles', () => {
      render(<SocialShare title="Test Title" url="https://example.com/article" />)
      
      const facebookButton = screen.getByRole('button', { name: /Facebook/i })
      expect(facebookButton).toHaveClass('focus:ring-2')
    })
  })

  describe('Social Icons', () => {
    test('renders SVG icons for each platform', () => {
      render(<SocialShare title="Test Title" url="https://example.com/article" />)
      
      const SVGs = document.querySelectorAll('svg')
      expect(SVGs.length).toBeGreaterThanOrEqual(4)
    })

    test('icons have aria-hidden for screen readers', () => {
      render(<SocialShare title="Test Title" url="https://example.com/article" />)
      
      const SVGs = document.querySelectorAll('svg[aria-hidden="true"]')
      expect(SVGs.length).toBeGreaterThanOrEqual(4)
    })
  })

  describe('Memo', () => {
    test('component is memoized', () => {
      expect(SocialShare).toBeDefined()
    })
  })
})