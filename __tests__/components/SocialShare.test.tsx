import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import SocialShare from '@/components/ui/SocialShare'

jest.mock('@/lib/api/config', () => ({
  SITE_URL: 'https://example.com'
}))

describe('SocialShare Component', () => {
  const defaultProps = {
    title: 'Test Article Title',
    url: '/test-article'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
    cleanup()
  })

  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    test('renders social share buttons container', () => {
      render(<SocialShare {...defaultProps} />)
      const container = document.querySelector('[class*="flex items-center"]')
      expect(container).toBeInTheDocument()
    })

    test('renders all platform buttons', () => {
      render(<SocialShare {...defaultProps} />)
      expect(screen.getAllByRole('button')).toHaveLength(4)
    })

    test('renders with custom className', () => {
      render(<SocialShare {...defaultProps} className="custom-class" />)
      const container = document.querySelector('.custom-class')
      expect(container).toBeInTheDocument()
    })

    test('renders without className when not provided', () => {
      const { container } = render(<SocialShare {...defaultProps} />)
      expect(container.firstChild).toHaveAttribute('class', '')
    })
  })

  describe('Platform Buttons', () => {
    test('renders Facebook button with correct aria-label', () => {
      render(<SocialShare {...defaultProps} />)
      expect(screen.getByRole('button', { name: /Bagikan ke Facebook/i })).toBeInTheDocument()
    })

    test('renders Twitter button with correct aria-label', () => {
      render(<SocialShare {...defaultProps} />)
      expect(screen.getByRole('button', { name: /Bagikan ke Twitter/i })).toBeInTheDocument()
    })

    test('renders WhatsApp button with correct aria-label', () => {
      render(<SocialShare {...defaultProps} />)
      expect(screen.getByRole('button', { name: /Bagikan ke WhatsApp/i })).toBeInTheDocument()
    })

    test('renders copy link button with initial aria-label', () => {
      render(<SocialShare {...defaultProps} />)
      expect(screen.getByRole('button', { name: 'Salin tautan' })).toBeInTheDocument()
    })
  })

  describe('Share Functionality', () => {
    test('opens Facebook share URL on click', () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null)
      render(<SocialShare {...defaultProps} />)
      
      const facebookButton = screen.getByRole('button', { name: /Bagikan ke Facebook/i })
      fireEvent.click(facebookButton)
      
      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining('facebook.com/sharer/sharer.php'),
        '_blank',
        expect.stringContaining('noopener,noreferrer')
      )
      openSpy.mockRestore()
    })

    test('opens Twitter share URL on click', () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null)
      render(<SocialShare {...defaultProps} />)
      
      const twitterButton = screen.getByRole('button', { name: /Bagikan ke Twitter/i })
      fireEvent.click(twitterButton)
      
      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining('twitter.com/intent/tweet'),
        '_blank',
        expect.stringContaining('noopener,noreferrer')
      )
      openSpy.mockRestore()
    })

    test('opens WhatsApp share URL on click', () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null)
      render(<SocialShare {...defaultProps} />)
      
      const whatsappButton = screen.getByRole('button', { name: /Bagikan ke WhatsApp/i })
      fireEvent.click(whatsappButton)
      
      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining('wa.me'),
        '_blank',
        expect.stringContaining('noopener,noreferrer')
      )
      openSpy.mockRestore()
    })

    test('uses full URL for absolute URLs', () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null)
      const absoluteUrl = 'https://example.com/test-article'
      render(<SocialShare {...defaultProps} url={absoluteUrl} />)
      
      const facebookButton = screen.getByRole('button', { name: /Bagikan ke Facebook/i })
      fireEvent.click(facebookButton)
      
      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent(absoluteUrl)),
        '_blank',
        expect.any(String)
      )
      openSpy.mockRestore()
    })

    test('prepends SITE_URL for relative URLs', () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null)
      const relativeUrl = '/test-article'
      render(<SocialShare {...defaultProps} url={relativeUrl} />)
      
      const facebookButton = screen.getByRole('button', { name: /Bagikan ke Facebook/i })
      fireEvent.click(facebookButton)
      
      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent('https://example.com/test-article')),
        '_blank',
        expect.any(String)
      )
      openSpy.mockRestore()
    })
  })

  describe('Copy Link Functionality', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: jest.fn().mockResolvedValue(undefined) },
        configurable: true
      })
    })

    afterEach(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: jest.fn().mockResolvedValue(undefined) },
        configurable: true
      })
    })

    test('copies URL to clipboard when navigator.clipboard is available', async () => {
      render(<SocialShare {...defaultProps} />)
      
      const copyButton = screen.getByRole('button', { name: 'Salin tautan' })
      fireEvent.click(copyButton)
      
      await screen.findByRole('button', { name: 'Tautan disalin' })
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('example.com'))
    })

    test('updates aria-label after copying', async () => {
      render(<SocialShare {...defaultProps} />)
      
      const copyButton = screen.getByRole('button', { name: 'Salin tautan' })
      fireEvent.click(copyButton)
      
      expect(await screen.findByRole('button', { name: 'Tautan disalin' })).toBeInTheDocument()
    })

    test('shows check icon after copying', async () => {
      render(<SocialShare {...defaultProps} />)
      
      const copyButton = screen.getByRole('button', { name: 'Salin tautan' })
      fireEvent.click(copyButton)
      
      expect(await screen.findByRole('button', { name: 'Tautan disalin' })).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    test('all buttons have focus styles', () => {
      render(<SocialShare {...defaultProps} />)
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveClass('focus:outline-none')
        expect(button).toHaveClass('focus:ring-2')
      })
    })

    test('platform buttons have aria-label', () => {
      render(<SocialShare {...defaultProps} />)
      expect(screen.getByRole('button', { name: /Bagikan ke Facebook/i })).toHaveAttribute('aria-label')
      expect(screen.getByRole('button', { name: /Bagikan ke Twitter/i })).toHaveAttribute('aria-label')
      expect(screen.getByRole('button', { name: /Bagikan ke WhatsApp/i })).toHaveAttribute('aria-label')
    })

    test('SVG icons have aria-hidden', () => {
      render(<SocialShare {...defaultProps} />)
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button.querySelector('svg[aria-hidden="true"]')).toBeInTheDocument()
      })
    })
  })

  describe('URL Encoding', () => {
    test('encodes title in share URL', () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null)
      render(<SocialShare {...defaultProps} title="Title with @#$% special chars" />)
      
      const twitterButton = screen.getByRole('button', { name: /Bagikan ke Twitter/i })
      fireEvent.click(twitterButton)
      
      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent('Title with @#$% special chars')),
        '_blank',
        expect.any(String)
      )
      openSpy.mockRestore()
    })

    test('encodes URL with spaces in share URL', () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null)
      render(<SocialShare {...defaultProps} url="/article with spaces" />)
      
      const facebookButton = screen.getByRole('button', { name: /Bagikan ke Facebook/i })
      fireEvent.click(facebookButton)
      
      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent('/article with spaces')),
        '_blank',
        expect.any(String)
      )
      openSpy.mockRestore()
    })
  })

  describe('Edge Cases', () => {
    test('handles empty title', () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null)
      render(<SocialShare {...defaultProps} title="" />)
      
      const twitterButton = screen.getByRole('button', { name: /Bagikan ke Twitter/i })
      fireEvent.click(twitterButton)
      
      expect(openSpy).toHaveBeenCalled()
      openSpy.mockRestore()
    })

    test('handles URL without leading slash', () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null)
      render(<SocialShare {...defaultProps} url="test-article" />)
      
      const facebookButton = screen.getByRole('button', { name: /Bagikan ke Facebook/i })
      fireEvent.click(facebookButton)
      
      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining('test-article'),
        '_blank',
        expect.any(String)
      )
      openSpy.mockRestore()
    })
  })
})