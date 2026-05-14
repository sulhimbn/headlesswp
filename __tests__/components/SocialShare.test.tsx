import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import SocialShare from '@/components/ui/SocialShare'

const mockWindowOpen = jest.fn()
const mockClipboardWriteText = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  window.open = mockWindowOpen
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: mockClipboardWriteText },
    writable: true
  })
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('SocialShare Component', () => {
  describe('Rendering', () => {
    test('renders all social platform buttons', () => {
      render(<SocialShare title="Test Title" url="https://example.com/article" />)
      
      expect(screen.getByLabelText(/Bagikan ke Facebook/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Bagikan ke Twitter/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Bagikan ke WhatsApp/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Salin tautan/i)).toBeInTheDocument()
    })

    test('renders with custom className', () => {
      render(<SocialShare title="Test" url="https://example.com" className="custom-class" />)
      
      const buttons = screen.getAllByRole('button')
      const container = buttons[0].parentElement
      expect(container?.parentElement).toHaveClass('custom-class')
    })

    test('renders all 4 share buttons', () => {
      render(<SocialShare title="Test Title" url="https://example.com" />)
      
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(4)
    })
  })

  describe('Share URLs Generation', () => {
    test('generates correct Facebook share URL', () => {
      render(<SocialShare title="Test Title" url="https://example.com/article" />)
      
      const facebookButton = screen.getByLabelText(/Bagikan ke Facebook/i)
      fireEvent.click(facebookButton)
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fexample.com%2Farticle',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('generates correct Twitter share URL with title and url', () => {
      render(<SocialShare title="Amazing Article" url="https://example.com/article" />)
      
      const twitterButton = screen.getByLabelText(/Bagikan ke Twitter/i)
      fireEvent.click(twitterButton)
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://twitter.com/intent/tweet?text=Amazing%20Article&url=https%3A%2F%2Fexample.com%2Farticle',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('generates correct WhatsApp share URL', () => {
      render(<SocialShare title="Check this out" url="https://example.com/article" />)
      
      const whatsappButton = screen.getByLabelText(/Bagikan ke WhatsApp/i)
      fireEvent.click(whatsappButton)
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://wa.me/?text=Check%20this%20out%20https%3A%2F%2Fexample.com%2Farticle',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('generates correct URLs for relative URLs by prepending SITE_URL', () => {
      render(<SocialShare title="Test" url="/blog/my-article" />)
      
      const twitterButton = screen.getByLabelText(/Bagikan ke Twitter/i)
      fireEvent.click(twitterButton)
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('http%3A%2F%2Flocalhost%3A3000%2Fblog%2Fmy-article'),
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })
  })

  describe('Click Handlers', () => {
    test('opens new window for platform share buttons', () => {
      render(<SocialShare title="Test" url="https://example.com" />)
      
      const buttons = [
        screen.getByLabelText(/Bagikan ke Facebook/i),
        screen.getByLabelText(/Bagikan ke Twitter/i),
        screen.getByLabelText(/Bagikan ke WhatsApp/i)
      ]
      
      buttons.forEach(button => {
        fireEvent.click(button)
        expect(mockWindowOpen).toHaveBeenCalled()
        mockWindowOpen.mockClear()
      })
    })

    test('copies URL to clipboard when copy button is clicked', async () => {
      mockClipboardWriteText.mockResolvedValue(undefined)
      
      render(<SocialShare title="Test" url="https://example.com/article" />)
      
      const copyButton = screen.getByLabelText(/Salin tautan/i)
      fireEvent.click(copyButton)
      
      expect(mockClipboardWriteText).toHaveBeenCalledWith('https://example.com/article')
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Tautan disalin/i)).toBeInTheDocument()
      })
    })

    test('shows copied state after copying link', async () => {
      mockClipboardWriteText.mockResolvedValue(undefined)
      
      render(<SocialShare title="Test" url="https://example.com/article" />)
      
      const copyButton = screen.getByLabelText(/Salin tautan/i)
      fireEvent.click(copyButton)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Tautan disalin/i)).toBeInTheDocument()
      })
    })

    test('handles clipboard API failure gracefully', async () => {
      mockClipboardWriteText.mockRejectedValue(new Error('Clipboard error'))
      
      render(<SocialShare title="Test" url="https://example.com/article" />)
      
      const copyButton = screen.getByLabelText(/Salin tautan/i)
      fireEvent.click(copyButton)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Tautan disalin/i)).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    test('handles empty title', () => {
      render(<SocialShare title="" url="https://example.com" />)
      
      const whatsappButton = screen.getByLabelText(/Bagikan ke WhatsApp/i)
      fireEvent.click(whatsappButton)
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('wa.me'),
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('handles relative URL correctly', () => {
      render(<SocialShare title="Test" url="/path/to/article" />)
      
      const facebookButton = screen.getByLabelText(/Bagikan ke Facebook/i)
      fireEvent.click(facebookButton)
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('http%3A%2F%2Flocalhost%3A3000%2Fpath%2Fto%2Farticle'),
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('handles URL with special characters in title', () => {
      render(<SocialShare title="Title with & <special> chars" url="https://example.com" />)
      
      const twitterButton = screen.getByLabelText(/Bagikan ke Twitter/i)
      fireEvent.click(twitterButton)
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('Title%20with%20%26%20%3Cspecial%3E%20chars'),
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('resets copied state after timeout', async () => {
      jest.useFakeTimers()
      mockClipboardWriteText.mockResolvedValue(undefined)
      
      render(<SocialShare title="Test" url="https://example.com" />)
      
      const copyButton = screen.getByLabelText(/Salin tautan/i)
      
      await act(async () => {
        fireEvent.click(copyButton)
      })
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Tautan disalin/i)).toBeInTheDocument()
      })
      
      await act(async () => {
        jest.advanceTimersByTime(2000)
      })
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Salin tautan/i)).toBeInTheDocument()
      })
      
      jest.useRealTimers()
    })

    test('renders without className prop', () => {
      render(<SocialShare title="Test" url="https://example.com" />)
      
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(4)
    })

    test('handles URL that already starts with http', () => {
      render(<SocialShare title="Test" url="http://example.com" />)
      
      const twitterButton = screen.getByLabelText(/Bagikan ke Twitter/i)
      fireEvent.click(twitterButton)
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('http%3A%2F%2Fexample.com'),
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('handles URL with query parameters', () => {
      render(<SocialShare title="Test" url="https://example.com?param=value" />)
      
      const twitterButton = screen.getByLabelText(/Bagikan ke Twitter/i)
      fireEvent.click(twitterButton)
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('param%3Dvalue'),
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })
  })

  describe('Accessibility', () => {
    test('buttons have proper aria-labels', () => {
      render(<SocialShare title="Test" url="https://example.com" />)
      
      expect(screen.getAllByLabelText(/Bagikan ke/i)).toHaveLength(3)
    })

    test('copy button updates aria-label when copied', async () => {
      mockClipboardWriteText.mockResolvedValue(undefined)
      
      render(<SocialShare title="Test" url="https://example.com" />)
      
      const copyButton = screen.getByLabelText(/Salin tautan/i)
      fireEvent.click(copyButton)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Tautan disalin/i)).toBeInTheDocument()
      })
    })

    test('buttons have focus styles', () => {
      render(<SocialShare title="Test" url="https://example.com" />)
      
      const button = screen.getByLabelText(/Bagikan ke Facebook/i)
      expect(button).toHaveClass('focus:outline-none')
      expect(button).toHaveClass('focus:ring-2')
    })
  })
})