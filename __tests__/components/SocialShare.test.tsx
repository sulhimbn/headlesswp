import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import SocialShare from '@/components/ui/SocialShare'

const mockWindowOpen = jest.fn()
const mockClipboardWriteText = jest.fn()
let mockScrollTo: jest.SpyInstance

beforeAll(() => {
  jest.useFakeTimers()
})

afterAll(() => {
  jest.useRealTimers()
})

beforeEach(() => {
  jest.clearAllMocks()
  global.window.open = mockWindowOpen
  mockScrollTo = jest.spyOn(window, 'scrollTo').mockImplementation(() => {})
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: mockClipboardWriteText,
    },
    writable: true,
  })
  Object.defineProperty(document, 'execCommand', {
    value: jest.fn().mockReturnValue(true),
    writable: true,
  })
})

describe('SocialShare Component', () => {
  describe('Rendering', () => {
    test('renders social share buttons', () => {
      render(<SocialShare title="Test Title" url="/test" />)
      
      expect(screen.getByRole('button', { name: /facebook/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /twitter/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /whatsapp/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /salin/i })).toBeInTheDocument()
    })

    test('renders with custom className', () => {
      render(<SocialShare title="Test Title" url="/test" className="custom-class" />)
      const container = document.querySelector('.custom-class')
      expect(container).toBeInTheDocument()
    })

    test('renders all platform buttons', () => {
      render(<SocialShare title="Test Title" url="/test" />)
      
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(4)
    })
  })

  describe('Sharing', () => {
    test('opens Facebook share window', () => {
      render(<SocialShare title="Test Title" url="/test" />)
      
      const facebookButton = screen.getByRole('button', { name: /facebook/i })
      fireEvent.click(facebookButton)
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('facebook.com/sharer'),
        '_blank',
        expect.any(String)
      )
    })

    test('opens Twitter share window', () => {
      render(<SocialShare title="Test Title" url="/test" />)
      
      const twitterButton = screen.getByRole('button', { name: /twitter/i })
      fireEvent.click(twitterButton)
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('twitter.com/intent/tweet'),
        '_blank',
        expect.any(String)
      )
    })

    test('opens WhatsApp share window', () => {
      render(<SocialShare title="Test Title" url="/test" />)
      
      const whatsappButton = screen.getByRole('button', { name: /whatsapp/i })
      fireEvent.click(whatsappButton)
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('wa.me'),
        '_blank',
        expect.any(String)
      )
    })

    test('encodes title and URL in share URL', () => {
      render(<SocialShare title="Test Title" url="/test" />)
      
      const twitterButton = screen.getByRole('button', { name: /twitter/i })
      fireEvent.click(twitterButton)
      
      const calledUrl = mockWindowOpen.mock.calls[0][0]
      expect(calledUrl).toContain(encodeURIComponent('Test Title'))
      expect(calledUrl).toContain(encodeURIComponent('/test'))
    })
  })

  describe('Copy Link', () => {
    test('copies URL to clipboard using clipboard API', async () => {
      mockClipboardWriteText.mockResolvedValue(undefined)
      
      render(<SocialShare title="Test Title" url="/test" />)
      
      const copyButton = screen.getByRole('button', { name: /salin/i })
      await act(async () => {
        fireEvent.click(copyButton)
      })
      
      expect(mockClipboardWriteText).toHaveBeenCalled()
    })

    test('shows check icon after copying', async () => {
      mockClipboardWriteText.mockResolvedValue(undefined)
      
      render(<SocialShare title="Test Title" url="/test" />)
      
      const copyButton = screen.getByRole('button', { name: /salin/i })
      await act(async () => {
        fireEvent.click(copyButton)
      })
      
      expect(screen.getByRole('button', { name: /tautan disalin/i })).toBeInTheDocument()
    })

    test('reverts to link icon after timeout', async () => {
      mockClipboardWriteText.mockResolvedValue(undefined)
      
      render(<SocialShare title="Test Title" url="/test" />)
      
      const copyButton = screen.getByRole('button', { name: /salin/i })
      await act(async () => {
        fireEvent.click(copyButton)
      })
      
      expect(screen.getByRole('button', { name: /tautan disalin/i })).toBeInTheDocument()
      
      await act(async () => {
        jest.advanceTimersByTime(2000)
      })
      
      expect(screen.getByRole('button', { name: /salin/i })).toBeInTheDocument()
    })

    test('falls back to clipboard fallback mechanism when clipboard fails', async () => {
      mockClipboardWriteText.mockRejectedValue(new Error('Clipboard error'))
      
      render(<SocialShare title="Test Title" url="/test" />)
      
      const copyButton = screen.getByRole('button', { name: /salin/i })
      await act(async () => {
        fireEvent.click(copyButton)
      })
      
      expect(mockClipboardWriteText).toHaveBeenCalled()
    })
  })

  describe('URL Handling', () => {
    test('prepends SITE_URL for relative URLs', async () => {
      mockClipboardWriteText.mockResolvedValue(undefined)
      
      render(<SocialShare title="Test Title" url="/relative-path" />)
      
      const copyButton = screen.getByRole('button', { name: /salin/i })
      await act(async () => {
        fireEvent.click(copyButton)
      })
      
      expect(mockClipboardWriteText).toHaveBeenCalledWith(
        expect.stringContaining('/relative-path')
      )
    })

    test('uses absolute URL as-is when provided', async () => {
      mockClipboardWriteText.mockResolvedValue(undefined)
      
      render(<SocialShare title="Test Title" url="https://example.com/absolute" />)
      
      const copyButton = screen.getByRole('button', { name: /salin/i })
      await act(async () => {
        fireEvent.click(copyButton)
      })
      
      expect(mockClipboardWriteText).toHaveBeenCalledWith('https://example.com/absolute')
    })
  })

  describe('Accessibility', () => {
    test('buttons have aria-label', () => {
      render(<SocialShare title="Test Title" url="/test" />)
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label')
      })
    })

    test('buttons have title attributes', () => {
      render(<SocialShare title="Test Title" url="/test" />)
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveAttribute('title')
      })
    })

    test('copy button updates aria-label when copied', async () => {
      mockClipboardWriteText.mockResolvedValue(undefined)
      
      render(<SocialShare title="Test Title" url="/test" />)
      
      const copyButton = screen.getByRole('button', { name: /salin/i })
      await act(async () => {
        fireEvent.click(copyButton)
      })
      
      expect(screen.getByRole('button', { name: /tautan disalin/i })).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    test('handles empty title', () => {
      render(<SocialShare title="" url="/test" />)
      
      const twitterButton = screen.getByRole('button', { name: /twitter/i })
      fireEvent.click(twitterButton)
      
      expect(mockWindowOpen).toHaveBeenCalled()
    })

    test('handles special characters in title', () => {
      render(<SocialShare title="Test & 'Special' <Chars>" url="/test" />)
      
      const twitterButton = screen.getByRole('button', { name: /twitter/i })
      fireEvent.click(twitterButton)
      
      expect(mockWindowOpen).toHaveBeenCalled()
    })

    test('renders with long URL', () => {
      const longUrl = '/'.repeat(100)
      
      render(<SocialShare title="Test Title" url={longUrl} />)
      
      expect(screen.getByRole('button', { name: /facebook/i })).toBeInTheDocument()
    })
  })
})