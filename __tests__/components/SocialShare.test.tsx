import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import SocialShare from '@/components/ui/SocialShare'

const originalClipboard = navigator.clipboard
const originalOpen = window.open

const mockClipboard = {
  writeText: jest.fn(),
  readText: jest.fn(),
}

describe('SocialShare Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      writable: true,
      configurable: true,
    })
    window.open = jest.fn()
  })

  afterEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      writable: true,
      configurable: true,
    })
    window.open = originalOpen
  })

  describe('Rendering', () => {
    test('renders all social platform buttons', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      expect(screen.getByRole('button', { name: /Bagikan ke Facebook/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Bagikan ke Twitter/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Bagikan ke WhatsApp/i })).toBeInTheDocument()
    })

    test('renders copy link button', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      expect(screen.getByRole('button', { name: /Salin tautan/i })).toBeInTheDocument()
    })

    test('renders with custom className', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" className="custom-class" />)
      
      const container = screen.getByRole('button', { name: /Bagikan ke Facebook/i }).parentElement?.parentElement
      expect(container).toHaveClass('custom-class')
    })
  })

  describe('Share Window Functionality', () => {
    test('opens Facebook share window with correct URL', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      const facebookButton = screen.getByRole('button', { name: /Bagikan ke Facebook/i })
      fireEvent.click(facebookButton)
      
      expect(window.open).toHaveBeenCalledWith(
        'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fexample.com%2Ftest',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('opens Twitter share window with correct URL', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      const twitterButton = screen.getByRole('button', { name: /Bagikan ke Twitter/i })
      fireEvent.click(twitterButton)
      
      expect(window.open).toHaveBeenCalledWith(
        'https://twitter.com/intent/tweet?text=Test%20Title&url=https%3A%2F%2Fexample.com%2Ftest',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('opens WhatsApp share window with correct URL', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      const whatsappButton = screen.getByRole('button', { name: /Bagikan ke WhatsApp/i })
      fireEvent.click(whatsappButton)
      
      expect(window.open).toHaveBeenCalledWith(
        'https://wa.me/?text=Test%20Title%20https%3A%2F%2Fexample.com%2Ftest',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })
  })

  describe('Copy Link Functionality', () => {
    test('copies URL to clipboard using Clipboard API', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined)
      
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      const copyButton = screen.getByRole('button', { name: /Salin tautan/i })
      
      await act(async () => {
        fireEvent.click(copyButton)
      })
      
      expect(mockClipboard.writeText).toHaveBeenCalledWith('https://example.com/test')
    })

    test('shows success state after copying', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined)
      
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      const copyButton = screen.getByRole('button', { name: /Salin tautan/i })
      
      await act(async () => {
        fireEvent.click(copyButton)
      })
      
      expect(screen.getByRole('button', { name: /Tautan disalin/i })).toBeInTheDocument()
    })

    test('resets to default state after 2 seconds', async () => {
      jest.useFakeTimers()
      mockClipboard.writeText.mockResolvedValue(undefined)
      
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      const copyButton = screen.getByRole('button', { name: /Salin tautan/i })
      
      await act(async () => {
        fireEvent.click(copyButton)
      })
      
      expect(screen.getByRole('button', { name: /Tautan disalin/i })).toBeInTheDocument()
      
      await act(async () => {
        jest.advanceTimersByTime(2000)
      })
      
      expect(screen.getByRole('button', { name: /Salin tautan/i })).toBeInTheDocument()
      
      jest.useRealTimers()
    })

    test('falls back to execCommand when Clipboard API fails', async () => {
      mockClipboard.writeText.mockRejectedValue(new Error('Clipboard access denied'))
      
      Object.defineProperty(document, 'execCommand', {
        value: jest.fn().mockReturnValue(true),
        writable: true,
        configurable: true,
      })
      
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      const copyButton = screen.getByRole('button', { name: /Salin tautan/i })
      
      await act(async () => {
        fireEvent.click(copyButton)
      })
      
      expect(document.execCommand).toHaveBeenCalledWith('copy')
      expect(screen.getByRole('button', { name: /Tautan disalin/i })).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    test('has correct aria-labels for all buttons', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      expect(screen.getByLabelText(/Bagikan ke Facebook/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Bagikan ke Twitter/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Bagikan ke WhatsApp/i)).toBeInTheDocument()
    })

    test('copy button aria-label changes based on state', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined)
      
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      expect(screen.getByLabelText(/Salin tautan/i)).toBeInTheDocument()
      
      const copyButton = screen.getByRole('button', { name: /Salin tautan/i })
      
      await act(async () => {
        fireEvent.click(copyButton)
      })
      
      expect(screen.getByLabelText(/Tautan disalin/i)).toBeInTheDocument()
    })

    test('all buttons have focus styles', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-offset-2')
      })
    })
  })

  describe('Memoization', () => {
    test('component is memoized', () => {
      expect(SocialShare.$$typeof).toBeDefined()
      expect(SocialShare.$$typeof.toString()).toBe('Symbol(react.memo)')
    })
  })

  describe('URL Handling', () => {
    test('prepends SITE_URL when URL does not start with http', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined)
      
      render(<SocialShare title="Test Title" url="/blog/test-post" />)
      
      const copyButton = screen.getByRole('button', { name: /Salin tautan/i })
      
      await act(async () => {
        fireEvent.click(copyButton)
      })
      
      expect(mockClipboard.writeText).toHaveBeenCalledWith('https://mitrabantennews.com/blog/test-post')
    })

    test('uses original URL when it starts with http', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined)
      
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      const copyButton = screen.getByRole('button', { name: /Salin tautan/i })
      
      await act(async () => {
        fireEvent.click(copyButton)
      })
      
      expect(mockClipboard.writeText).toHaveBeenCalledWith('https://example.com/test')
    })
  })
})