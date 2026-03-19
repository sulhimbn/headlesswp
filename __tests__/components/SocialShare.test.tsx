import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import SocialShare from '@/components/ui/SocialShare'

jest.mock('@/lib/api/config', () => ({
  SITE_URL: 'https://example.com'
}))

describe('SocialShare Component', () => {
  const defaultProps = {
    title: 'Test Article Title',
    url: 'https://example.com/test-article'
  }

  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Rendering', () => {
    test('renders share buttons container', () => {
      render(<SocialShare {...defaultProps} />)
      expect(screen.getByRole('button', { name: /Facebook/i })).toBeInTheDocument()
    })

    test('renders Facebook share button', () => {
      render(<SocialShare {...defaultProps} />)
      const facebookButton = screen.getByRole('button', { name: /Facebook/i })
      expect(facebookButton).toBeInTheDocument()
    })

    test('renders Twitter share button', () => {
      render(<SocialShare {...defaultProps} />)
      const twitterButton = screen.getByRole('button', { name: /Twitter/i })
      expect(twitterButton).toBeInTheDocument()
    })

    test('renders WhatsApp share button', () => {
      render(<SocialShare {...defaultProps} />)
      const whatsappButton = screen.getByRole('button', { name: /WhatsApp/i })
      expect(whatsappButton).toBeInTheDocument()
    })

    test('renders copy link button', () => {
      render(<SocialShare {...defaultProps} />)
      const copyButton = screen.getByRole('button', { name: /Salin tautan/i })
      expect(copyButton).toBeInTheDocument()
    })

    test('renders with custom className', () => {
      render(<SocialShare {...defaultProps} className="custom-class mt-4" />)
      const container = document.querySelector('.custom-class')
      expect(container).toBeInTheDocument()
    })

    test('renders with empty className', () => {
      render(<SocialShare {...defaultProps} className="" />)
      expect(screen.getByRole('button', { name: /Facebook/i })).toBeInTheDocument()
    })
  })

  describe('Social Icons', () => {
    test('renders Facebook icon SVG', () => {
      render(<SocialShare {...defaultProps} />)
      const facebookButton = screen.getByRole('button', { name: /Facebook/i })
      const svg = facebookButton.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    test('renders Twitter icon SVG', () => {
      render(<SocialShare {...defaultProps} />)
      const twitterButton = screen.getByRole('button', { name: /Twitter/i })
      const svg = twitterButton.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    test('renders WhatsApp icon SVG', () => {
      render(<SocialShare {...defaultProps} />)
      const whatsappButton = screen.getByRole('button', { name: /WhatsApp/i })
      const svg = whatsappButton.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    test('renders link icon initially', () => {
      render(<SocialShare {...defaultProps} />)
      const copyButton = screen.getByRole('button', { name: /Salin tautan/i })
      const svg = copyButton.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('Share Functionality', () => {
    test('opens Facebook share window', () => {
      const windowOpenMock = jest.fn()
      const originalOpen = window.open
      window.open = windowOpenMock

      render(<SocialShare {...defaultProps} />)
      const facebookButton = screen.getByRole('button', { name: /Facebook/i })
      fireEvent.click(facebookButton)

      expect(windowOpenMock).toHaveBeenCalledWith(
        expect.stringContaining('facebook.com/sharer/sharer.php'),
        '_blank',
        expect.any(String)
      )

      window.open = originalOpen
    })

    test('opens Twitter share window with encoded title and url', () => {
      const windowOpenMock = jest.fn()
      const originalOpen = window.open
      window.open = windowOpenMock

      render(<SocialShare {...defaultProps} />)
      const twitterButton = screen.getByRole('button', { name: /Twitter/i })
      fireEvent.click(twitterButton)

      expect(windowOpenMock).toHaveBeenCalledWith(
        expect.stringContaining('twitter.com/intent/tweet'),
        '_blank',
        expect.any(String)
      )

      window.open = originalOpen
    })

    test('opens WhatsApp share window', () => {
      const windowOpenMock = jest.fn()
      const originalOpen = window.open
      window.open = windowOpenMock

      render(<SocialShare {...defaultProps} />)
      const whatsappButton = screen.getByRole('button', { name: /WhatsApp/i })
      fireEvent.click(whatsappButton)

      expect(windowOpenMock).toHaveBeenCalledWith(
        expect.stringContaining('wa.me'),
        '_blank',
        expect.any(String)
      )

      window.open = originalOpen
    })

    test('passes correct window features to window.open', () => {
      const windowOpenMock = jest.fn()
      const originalOpen = window.open
      window.open = windowOpenMock

      render(<SocialShare {...defaultProps} />)
      const facebookButton = screen.getByRole('button', { name: /Facebook/i })
      fireEvent.click(facebookButton)

      expect(windowOpenMock).toHaveBeenCalledWith(
        expect.any(String),
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )

      window.open = originalOpen
    })
  })

  describe('Button Styling', () => {
    test('share buttons have rounded full style', () => {
      render(<SocialShare {...defaultProps} />)
      const facebookButton = screen.getByRole('button', { name: /Facebook/i })
      expect(facebookButton).toHaveClass('rounded-full')
    })

    test('share buttons have surface background color', () => {
      render(<SocialShare {...defaultProps} />)
      const facebookButton = screen.getByRole('button', { name: /Facebook/i })
      expect(facebookButton).toHaveClass('bg-[hsl(var(--color-surface))]')
    })

    test('share buttons have secondary text color', () => {
      render(<SocialShare {...defaultProps} />)
      const facebookButton = screen.getByRole('button', { name: /Facebook/i })
      expect(facebookButton).toHaveClass('text-[hsl(var(--color-text-secondary))]')
    })

    test('share buttons have transition styles', () => {
      render(<SocialShare {...defaultProps} />)
      const facebookButton = screen.getByRole('button', { name: /Facebook/i })
      expect(facebookButton).toHaveClass('transition-colors')
    })

    test('Facebook button has Facebook hover color', () => {
      render(<SocialShare {...defaultProps} />)
      const facebookButton = screen.getByRole('button', { name: /Facebook/i })
      expect(facebookButton).toHaveClass('hover:bg-[#1877F2]')
    })

    test('Twitter button has Twitter hover color', () => {
      render(<SocialShare {...defaultProps} />)
      const twitterButton = screen.getByRole('button', { name: /Twitter/i })
      expect(twitterButton).toHaveClass('hover:bg-[#1DA1F2]')
    })

    test('WhatsApp button has WhatsApp hover color', () => {
      render(<SocialShare {...defaultProps} />)
      const whatsappButton = screen.getByRole('button', { name: /WhatsApp/i })
      expect(whatsappButton).toHaveClass('hover:bg-[#25D366]')
    })

    test('copy button shows primary hover when not copied', () => {
      render(<SocialShare {...defaultProps} />)
      const copyButton = screen.getByRole('button', { name: /Salin tautan/i })
      expect(copyButton).toHaveClass('hover:bg-[hsl(var(--color-primary))]')
      expect(copyButton).toHaveClass('hover:text-white')
    })
  })

  describe('Accessibility', () => {
    test('all buttons have aria-labels', () => {
      render(<SocialShare {...defaultProps} />)
      expect(screen.getByRole('button', { name: /Facebook/i })).toHaveAttribute('aria-label')
      expect(screen.getByRole('button', { name: /Twitter/i })).toHaveAttribute('aria-label')
      expect(screen.getByRole('button', { name: /WhatsApp/i })).toHaveAttribute('aria-label')
      expect(screen.getByRole('button', { name: /Salin tautan/i })).toHaveAttribute('aria-label')
    })

    test('all buttons have titles', () => {
      render(<SocialShare {...defaultProps} />)
      expect(screen.getByRole('button', { name: /Facebook/i })).toHaveAttribute('title')
      expect(screen.getByRole('button', { name: /Twitter/i })).toHaveAttribute('title')
      expect(screen.getByRole('button', { name: /WhatsApp/i })).toHaveAttribute('title')
      expect(screen.getByRole('button', { name: /Salin tautan/i })).toHaveAttribute('title')
    })

    test('share buttons have focus ring styles', () => {
      render(<SocialShare {...defaultProps} />)
      const facebookButton = screen.getByRole('button', { name: /Facebook/i })
      expect(facebookButton).toHaveClass('focus:outline-none')
      expect(facebookButton).toHaveClass('focus:ring-2')
      expect(facebookButton).toHaveClass('focus:ring-[hsl(var(--color-primary))]')
      expect(facebookButton).toHaveClass('focus:ring-offset-2')
    })

    test('SVG icons are hidden from screen readers', () => {
      render(<SocialShare {...defaultProps} />)
      const facebookButton = screen.getByRole('button', { name: /Facebook/i })
      const svgs = facebookButton.querySelectorAll('svg')
      svgs.forEach(svg => {
        expect(svg).toHaveAttribute('aria-hidden', 'true')
      })
    })
  })
})
