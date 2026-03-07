import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import SocialShare from '@/components/ui/SocialShare'

jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
}))

jest.mock('@/lib/api/config', () => ({
  SITE_URL: 'https://example.com',
}))

describe('SocialShare Component', () => {
  const originalOpen = window.open
  let mockClipboardWriteText: jest.Mock

  beforeEach(() => {
    jest.useFakeTimers()
    mockClipboardWriteText = jest.fn().mockResolvedValue(undefined)
    
    window.open = jest.fn().mockReturnValue(null)
    
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockClipboardWriteText },
      writable: true,
    })
  })

  afterEach(() => {
    jest.useRealTimers()
    window.open = originalOpen
  })

  const mockTitle = 'Test Article Title'
  const mockUrl = '/berita/test-article'

  describe('Rendering', () => {
    test('renders all social platform buttons', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)

      expect(screen.getByRole('button', { name: /Bagikan ke Facebook/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Bagikan ke Twitter/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Bagikan ke WhatsApp/i })).toBeInTheDocument()
    })

    test('renders copy link button', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)

      expect(screen.getByRole('button', { name: /Salin tautan/i })).toBeInTheDocument()
    })

    test('renders with custom className', () => {
      const { container } = render(<SocialShare title={mockTitle} url={mockUrl} className="custom-class" />)

      expect(container.firstChild).toHaveClass('custom-class')
    })

    test('renders 4 buttons total (3 share + 1 copy)', () => {
      const { container } = render(<SocialShare title={mockTitle} url={mockUrl} />)

      const buttons = container.querySelectorAll('button')
      expect(buttons.length).toBe(4)
    })
  })

  describe('Share button clicks', () => {
    test('Facebook button opens correct URL', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)

      const facebookButton = screen.getByRole('button', { name: /Bagikan ke Facebook/i })
      fireEvent.click(facebookButton)

      expect(window.open).toHaveBeenCalledWith(
        'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fexample.com%2Fberita%2Ftest-article',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('Twitter button opens correct URL', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)

      const twitterButton = screen.getByRole('button', { name: /Bagikan ke Twitter/i })
      fireEvent.click(twitterButton)

      expect(window.open).toHaveBeenCalledWith(
        'https://twitter.com/intent/tweet?text=Test%20Article%20Title&url=https%3A%2F%2Fexample.com%2Fberita%2Ftest-article',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('WhatsApp button opens correct URL', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)

      const whatsappButton = screen.getByRole('button', { name: /Bagikan ke WhatsApp/i })
      fireEvent.click(whatsappButton)

      expect(window.open).toHaveBeenCalledWith(
        'https://wa.me/?text=Test%20Article%20Title%20https%3A%2F%2Fexample.com%2Fberita%2Ftest-article',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('share buttons work with absolute URLs', () => {
      const absoluteUrl = 'https://other-site.com/article'
      render(<SocialShare title={mockTitle} url={absoluteUrl} />)

      const facebookButton = screen.getByRole('button', { name: /Bagikan ke Facebook/i })
      fireEvent.click(facebookButton)

      expect(window.open).toHaveBeenCalledWith(
        'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fother-site.com%2Farticle',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })
  })

  describe('Copy link functionality with Clipboard API', () => {
    test('copies link with Clipboard API when available', async () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)

      const copyButton = screen.getByRole('button', { name: /Salin tautan/i })
      fireEvent.click(copyButton)

      await waitFor(() => {
        expect(mockClipboardWriteText).toHaveBeenCalledWith('https://example.com/berita/test-article')
      })
    })

    test('shows success state (checkmark) after copying', async () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)

      const copyButton = screen.getByRole('button', { name: /Salin tautan/i })
      fireEvent.click(copyButton)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Tautan disalin/i })).toBeInTheDocument()
      })
    })

    test('resets to original state after 2 seconds', async () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)

      const copyButton = screen.getByRole('button', { name: /Salin tautan/i })
      fireEvent.click(copyButton)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Tautan disalin/i })).toBeInTheDocument()
      })

      act(() => {
        jest.advanceTimersByTime(2000)
      })

      expect(screen.getByRole('button', { name: /Salin tautan/i })).toBeInTheDocument()
    })
  })

  describe('Platform URL generation', () => {
    test('generates correct Facebook share URL', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)

      const facebookButton = screen.getByRole('button', { name: /Bagikan ke Facebook/i })
      fireEvent.click(facebookButton)

      const calledUrl = (window.open as jest.Mock).mock.calls[0][0]
      expect(calledUrl).toContain('facebook.com/sharer/sharer.php')
      expect(calledUrl).toContain('u=')
    })

    test('generates correct Twitter share URL', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)

      const twitterButton = screen.getByRole('button', { name: /Bagikan ke Twitter/i })
      fireEvent.click(twitterButton)

      const calledUrl = (window.open as jest.Mock).mock.calls[0][0]
      expect(calledUrl).toContain('twitter.com/intent/tweet')
      expect(calledUrl).toContain('text=')
      expect(calledUrl).toContain('url=')
    })

    test('generates correct WhatsApp share URL', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)

      const whatsappButton = screen.getByRole('button', { name: /Bagikan ke WhatsApp/i })
      fireEvent.click(whatsappButton)

      const calledUrl = (window.open as jest.Mock).mock.calls[0][0]
      expect(calledUrl).toContain('wa.me/')
      expect(calledUrl).toContain('text=')
    })

    test('encodes URL parameters properly', () => {
      const urlWithSpaces = '/berita/my article title'
      render(<SocialShare title={mockTitle} url={urlWithSpaces} />)

      const facebookButton = screen.getByRole('button', { name: /Bagikan ke Facebook/i })
      fireEvent.click(facebookButton)

      const calledUrl = (window.open as jest.Mock).mock.calls[0][0]
      expect(calledUrl).toContain('my%20article%20title')
    })
  })

  describe('Accessibility', () => {
    test('share buttons have correct aria-label', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)

      expect(screen.getByLabelText(/Bagikan ke Facebook/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Bagikan ke Twitter/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Bagikan ke WhatsApp/)).toBeInTheDocument()
    })

    test('copy button has aria-label', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)

      expect(screen.getByLabelText(/Salin tautan/)).toBeInTheDocument()
    })

    test('buttons have title attributes', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)

      expect(screen.getByRole('button', { name: /Bagikan ke Facebook/i })).toHaveAttribute('title', 'Bagikan ke Facebook')
      expect(screen.getByRole('button', { name: /Salin tautan/i })).toHaveAttribute('title', 'Salin tautan')
    })
  })
})
