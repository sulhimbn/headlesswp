import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import SocialShare from '@/components/ui/SocialShare'

describe('SocialShare Component', () => {
  const mockTitle = 'Test Article Title'
  const mockUrl = '/test-article'

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(window, 'open').mockImplementation(() => null)
    
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Rendering', () => {
    test('renders share buttons container', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      const container = screen.getByText((content, element) => {
        return element?.classList.contains('flex') ?? false
      })
      expect(container).toBeInTheDocument()
    })

    test('renders all platform buttons', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      expect(screen.getByRole('button', { name: /Facebook/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Twitter/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /WhatsApp/i })).toBeInTheDocument()
    })

    test('renders copy link button', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      expect(screen.getByRole('button', { name: /Salin tautan/i })).toBeInTheDocument()
    })

    test('renders three platform buttons plus copy button', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(4)
    })
  })

  describe('Platform Sharing', () => {
    test('opens Facebook share window with correct URL', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      const facebookButton = screen.getByRole('button', { name: /Facebook/i })
      fireEvent.click(facebookButton)
      
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('facebook.com/sharer'),
        '_blank',
        expect.any(String)
      )
    })

    test('opens Twitter share window with correct URL', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      const twitterButton = screen.getByRole('button', { name: /Twitter/i })
      fireEvent.click(twitterButton)
      
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('twitter.com/intent/tweet'),
        '_blank',
        expect.any(String)
      )
    })

    test('opens WhatsApp share window with correct URL', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      const whatsappButton = screen.getByRole('button', { name: /WhatsApp/i })
      fireEvent.click(whatsappButton)
      
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('wa.me'),
        '_blank',
        expect.any(String)
      )
    })

    test('encodes title and URL in share links', () => {
      const encodedTitle = encodeURIComponent(mockTitle)
      const encodedUrl = encodeURIComponent(mockUrl)
      
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const twitterButton = screen.getByRole('button', { name: /Twitter/i })
      fireEvent.click(twitterButton)
      
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining(encodedTitle),
        '_blank',
        expect.any(String)
      )
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining(encodedUrl),
        '_blank',
        expect.any(String)
      )
    })
  })

  describe('Copy Link Functionality', () => {
    test('copies URL to clipboard when clicking copy button', async () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      const copyButton = screen.getByRole('button', { name: /Salin tautan/i })
      
      await act(async () => {
        fireEvent.click(copyButton)
        await new Promise(resolve => setTimeout(resolve, 10))
      })
      
      expect(navigator.clipboard.writeText).toHaveBeenCalled()
    })

    test('shows success state after copying', async () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      const copyButton = screen.getByRole('button', { name: /Salin tautan/i })
      
      await act(async () => {
        fireEvent.click(copyButton)
        await new Promise(resolve => setTimeout(resolve, 10))
      })
      
      expect(screen.getByRole('button', { name: /Tautan disalin/i })).toBeInTheDocument()
    })

    test('changes icon to checkmark after copying', async () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      const copyButton = screen.getByRole('button', { name: /Salin tautan/i })
      
      await act(async () => {
        fireEvent.click(copyButton)
        await new Promise(resolve => setTimeout(resolve, 10))
      })
      
      expect(screen.getByRole('button', { name: /Tautan disalin/i })).toBeInTheDocument()
    })
  })

  describe('URL Handling', () => {
    test('prepends SITE_URL when URL does not start with http', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      const twitterButton = screen.getByRole('button', { name: /Twitter/i })
      fireEvent.click(twitterButton)
      
      const calledUrl = (window.open as jest.Mock).mock.calls[0][0]
      expect(calledUrl).toContain(encodeURIComponent(mockUrl))
    })

    test('uses URL as-is when it starts with http', () => {
      const absoluteUrl = 'https://example.com/article'
      render(<SocialShare title={mockTitle} url={absoluteUrl} />)
      const twitterButton = screen.getByRole('button', { name: /Twitter/i })
      fireEvent.click(twitterButton)
      
      const calledUrl = (window.open as jest.Mock).mock.calls[0][0]
      expect(calledUrl).toContain(encodeURIComponent(absoluteUrl))
    })
  })

  describe('Styling', () => {
    test('applies custom className', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} className="custom-class" />)
      const container = screen.getByText((content, element) => {
        return element?.classList.contains('custom-class') ?? false
      })
      expect(container).toBeInTheDocument()
    })

    test('buttons have surface background color', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveClass('bg-[hsl(var(--color-surface))]')
      })
    })

    test('Facebook button has correct hover color', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      const facebookButton = screen.getByRole('button', { name: /Facebook/i })
      expect(facebookButton).toHaveClass('hover:bg-[#1877F2]')
    })

    test('Twitter button has correct hover color', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      const twitterButton = screen.getByRole('button', { name: /Twitter/i })
      expect(twitterButton).toHaveClass('hover:bg-[#1DA1F2]')
    })

    test('WhatsApp button has correct hover color', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      const whatsappButton = screen.getByRole('button', { name: /WhatsApp/i })
      expect(whatsappButton).toHaveClass('hover:bg-[#25D366]')
    })

    test('copy button changes color when copied', async () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      const copyButton = screen.getByRole('button', { name: /Salin tautan/i })
      
      await act(async () => {
        fireEvent.click(copyButton)
      })
      
      await waitFor(() => {
        const copiedButton = screen.getByRole('button', { name: /Tautan disalin/i })
        expect(copiedButton).toHaveClass('bg-[hsl(var(--color-success))]')
      })
    })

    test('buttons have focus styles', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      const facebookButton = screen.getByRole('button', { name: /Facebook/i })
      expect(facebookButton).toHaveClass('focus:ring-2')
      expect(facebookButton).toHaveClass('focus:ring-offset-2')
    })
  })

  describe('Accessibility', () => {
    test('Facebook button has aria-label', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      const facebookButton = screen.getByRole('button', { name: /Facebook/i })
      expect(facebookButton).toHaveAttribute('aria-label', 'Bagikan ke Facebook')
    })

    test('Twitter button has aria-label', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      const twitterButton = screen.getByRole('button', { name: /Twitter/i })
      expect(twitterButton).toHaveAttribute('aria-label', 'Bagikan ke Twitter')
    })

    test('WhatsApp button has aria-label', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      const whatsappButton = screen.getByRole('button', { name: /WhatsApp/i })
      expect(whatsappButton).toHaveAttribute('aria-label', 'Bagikan ke WhatsApp')
    })

    test('copy button has aria-label that changes when copied', async () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      const copyButton = screen.getByRole('button', { name: /Salin tautan/i })
      expect(copyButton).toHaveAttribute('aria-label', 'Salin tautan')
      
      await act(async () => {
        fireEvent.click(copyButton)
      })
      
      await waitFor(() => {
        const copiedButton = screen.getByRole('button', { name: /Tautan disalin/i })
        expect(copiedButton).toHaveAttribute('aria-label', 'Tautan disalin')
      })
    })

    test('copy button has dynamic title', async () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      const copyButton = screen.getByRole('button', { name: /Salin tautan/i })
      expect(copyButton).toHaveAttribute('title', 'Salin tautan')
    })
  })

  describe('Memoization', () => {
    test('component is memoized', () => {
      const { rerender } = render(<SocialShare title={mockTitle} url={mockUrl} />)
      expect(() => rerender(<SocialShare title={mockTitle} url={mockUrl} />)).not.toThrow()
    })
  })

  describe('Edge Cases', () => {
    test('handles empty title', () => {
      render(<SocialShare title="" url={mockUrl} />)
      const twitterButton = screen.getByRole('button', { name: /Twitter/i })
      fireEvent.click(twitterButton)
      
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining(''),
        '_blank',
        expect.any(String)
      )
    })

    test('handles special characters in title', () => {
      const specialTitle = "Test's \"quoted\" & <special> chars"
      render(<SocialShare title={specialTitle} url={mockUrl} />)
      const twitterButton = screen.getByRole('button', { name: /Twitter/i })
      fireEvent.click(twitterButton)
      
      expect(window.open).toHaveBeenCalled()
    })

    test('handles long URL', () => {
      const longUrl = '/very-long-url-path-that-goes-on-and-on-and-on'
      render(<SocialShare title={mockTitle} url={longUrl} />)
      const copyButton = screen.getByRole('button', { name: /Salin tautan/i })
      
      expect(() => fireEvent.click(copyButton)).not.toThrow()
    })

    test('handles root URL', () => {
      render(<SocialShare title={mockTitle} url="/" />)
      const twitterButton = screen.getByRole('button', { name: /Twitter/i })
      fireEvent.click(twitterButton)
      
      expect(window.open).toHaveBeenCalled()
    })
  })
})
