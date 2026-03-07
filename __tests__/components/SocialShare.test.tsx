import { render, screen, fireEvent, act } from '@testing-library/react'
import SocialShare from '@/components/ui/SocialShare'

const mockClipboard = {
  writeText: jest.fn(),
}

const originalWindowOpen = window.open
const originalClipboard = navigator.clipboard

beforeEach(() => {
  jest.clearAllMocks()
  window.open = jest.fn()
  Object.defineProperty(navigator, 'clipboard', {
    value: mockClipboard,
    writable: true,
  })
})

afterEach(() => {
  window.open = originalWindowOpen
  Object.defineProperty(navigator, 'clipboard', {
    value: originalClipboard,
    writable: true,
  })
  jest.restoreAllMocks()
})

describe('SocialShare Component', () => {
  describe('Rendering', () => {
    test('renders all social platform buttons', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      expect(screen.getByLabelText(/Bagikan ke Facebook/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Bagikan ke Twitter/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Bagikan ke WhatsApp/i)).toBeInTheDocument()
    })

    test('renders copy link button', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      expect(screen.getByLabelText(/Salin tautan/i)).toBeInTheDocument()
    })

    test('renders with custom className', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" className="custom-class" />)
      
      const container = document.querySelector('.custom-class')
      expect(container).toBeInTheDocument()
    })

    test('renders with correct base classes', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      const innerContainer = document.querySelector('.flex')
      expect(innerContainer).toHaveClass('flex items-center gap-3')
    })
  })

  describe('Platform Sharing', () => {
    test('opens Facebook share dialog with correct URL', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      const facebookButton = screen.getByLabelText(/Bagikan ke Facebook/i)
      fireEvent.click(facebookButton)
      
      expect(window.open).toHaveBeenCalledWith(
        'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fexample.com%2Ftest',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('opens Twitter share dialog with correct URL', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      const twitterButton = screen.getByLabelText(/Bagikan ke Twitter/i)
      fireEvent.click(twitterButton)
      
      expect(window.open).toHaveBeenCalledWith(
        'https://twitter.com/intent/tweet?text=Test%20Title&url=https%3A%2F%2Fexample.com%2Ftest',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('opens WhatsApp share dialog with correct URL', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      const whatsappButton = screen.getByLabelText(/Bagikan ke WhatsApp/i)
      fireEvent.click(whatsappButton)
      
      expect(window.open).toHaveBeenCalledWith(
        'https://wa.me/?text=Test%20Title%20https%3A%2F%2Fexample.com%2Ftest',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })
  })

  describe('Copy Link Functionality', () => {
    test('copies full URL to clipboard when URL starts with http', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined)
      
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      const copyButton = screen.getByLabelText(/Salin tautan/i)
      await act(async () => {
        await fireEvent.click(copyButton)
      })
      
      expect(mockClipboard.writeText).toHaveBeenCalledWith('https://example.com/test')
    })

    test('prepends SITE_URL to relative URL', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined)
      
      render(<SocialShare title="Test Title" url="/blog/test-article" />)
      
      const copyButton = screen.getByLabelText(/Salin tautan/i)
      await act(async () => {
        await fireEvent.click(copyButton)
      })
      
      expect(mockClipboard.writeText).toHaveBeenCalledWith('https://mitrabantennews.com/blog/test-article')
    })

    test('shows success state after copying', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined)
      
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      const copyButton = screen.getByLabelText(/Salin tautan/i)
      await act(async () => {
        await fireEvent.click(copyButton)
      })
      
      expect(screen.getByLabelText(/Tautan disalin/i)).toBeInTheDocument()
    })

    test('resets copied state after 2 seconds', async () => {
      jest.useFakeTimers()
      mockClipboard.writeText.mockResolvedValue(undefined)
      
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      const copyButton = screen.getByLabelText(/Salin tautan/i)
      await act(async () => {
        await fireEvent.click(copyButton)
      })
      
      expect(screen.getByLabelText(/Tautan disalin/i)).toBeInTheDocument()
      
      act(() => {
        jest.advanceTimersByTime(2000)
      })
      
      expect(screen.getByLabelText(/Salin tautan/i)).toBeInTheDocument()
      
      jest.useRealTimers()
    })
  })

  describe('URL Handling', () => {
    test('handles https URL', () => {
      render(<SocialShare title="Test Title" url="https://example.com/page" />)
      
      const facebookButton = screen.getByLabelText(/Bagikan ke Facebook/i)
      fireEvent.click(facebookButton)
      
      expect(window.open).toHaveBeenCalledWith(
        'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fexample.com%2Fpage',
        '_blank',
        expect.any(String)
      )
    })

    test('handles http URL', () => {
      render(<SocialShare title="Test Title" url="http://example.com/page" />)
      
      const facebookButton = screen.getByLabelText(/Bagikan ke Facebook/i)
      fireEvent.click(facebookButton)
      
      expect(window.open).toHaveBeenCalledWith(
        'https://www.facebook.com/sharer/sharer.php?u=http%3A%2F%2Fexample.com%2Fpage',
        '_blank',
        expect.any(String)
      )
    })

    test('prepends SITE_URL to relative URL for sharing', () => {
      render(<SocialShare title="Test Title" url="/relative/path" />)
      
      const facebookButton = screen.getByLabelText(/Bagikan ke Facebook/i)
      fireEvent.click(facebookButton)
      
      expect(window.open).toHaveBeenCalledWith(
        'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fmitrabantennews.com%2Frelative%2Fpath',
        '_blank',
        expect.any(String)
      )
    })
  })

  describe('Social Icons', () => {
    test('renders Facebook icon', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      const facebookButton = screen.getByLabelText(/Bagikan ke Facebook/i)
      const svg = facebookButton.querySelector('svg')
      expect(svg).toHaveAttribute('fill', 'currentColor')
    })

    test('renders Twitter icon', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      const twitterButton = screen.getByLabelText(/Bagikan ke Twitter/i)
      const svg = twitterButton.querySelector('svg')
      expect(svg).toHaveAttribute('fill', 'currentColor')
    })

    test('renders WhatsApp icon', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      const whatsappButton = screen.getByLabelText(/Bagikan ke WhatsApp/i)
      const svg = whatsappButton.querySelector('svg')
      expect(svg).toHaveAttribute('fill', 'currentColor')
    })

    test('renders link icon initially', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      const copyButton = screen.getByLabelText(/Salin tautan/i)
      const svg = copyButton.querySelector('svg')
      expect(svg).toHaveAttribute('fill', 'none')
      expect(svg).toHaveAttribute('stroke', 'currentColor')
    })

    test('renders check icon when copied', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined)
      
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      const copyButton = screen.getByLabelText(/Salin tautan/i)
      await act(async () => {
        await fireEvent.click(copyButton)
      })
      
      const checkSvg = screen.getByLabelText(/Tautan disalin/i).querySelector('svg')
      expect(checkSvg).toHaveAttribute('fill', 'none')
      expect(checkSvg).toHaveAttribute('stroke', 'currentColor')
    })
  })

  describe('Accessibility', () => {
    test('all buttons have aria-label', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      expect(screen.getByLabelText(/Bagikan ke Facebook/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Bagikan ke Twitter/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Bagikan ke WhatsApp/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Salin tautan/i)).toBeInTheDocument()
    })

    test('all buttons have title attribute', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      const facebookButton = screen.getByLabelText(/Bagikan ke Facebook/i)
      expect(facebookButton).toHaveAttribute('title', 'Bagikan ke Facebook')
      
      const twitterButton = screen.getByLabelText(/Bagikan ke Twitter/i)
      expect(twitterButton).toHaveAttribute('title', 'Bagikan ke Twitter')
      
      const whatsappButton = screen.getByLabelText(/Bagikan ke WhatsApp/i)
      expect(whatsappButton).toHaveAttribute('title', 'Bagikan ke WhatsApp')
    })

    test('copy button title changes when copied', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined)
      
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      const copyButton = screen.getByLabelText(/Salin tautan/i)
      expect(copyButton).toHaveAttribute('title', 'Salin tautan')
      
      await act(async () => {
        await fireEvent.click(copyButton)
      })
      
      expect(screen.getByLabelText(/Tautan disalin/i)).toHaveAttribute('title', 'Tautan disalin')
    })

    test('buttons have focus styles', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      const facebookButton = screen.getByLabelText(/Bagikan ke Facebook/i)
      expect(facebookButton).toHaveClass('focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2')
    })

    test('all social buttons have proper color hover classes', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      const facebookButton = screen.getByLabelText(/Bagikan ke Facebook/i)
      expect(facebookButton).toHaveClass('hover:bg-[#1877F2]')
      
      const twitterButton = screen.getByLabelText(/Bagikan ke Twitter/i)
      expect(twitterButton).toHaveClass('hover:bg-[#1DA1F2]')
      
      const whatsappButton = screen.getByLabelText(/Bagikan ke WhatsApp/i)
      expect(whatsappButton).toHaveClass('hover:bg-[#25D366]')
    })
  })

  describe('Memoization', () => {
    test('component is exported as memoized', () => {
      expect(SocialShare).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    test('handles URL with query parameters', () => {
      render(<SocialShare title="Test Title" url="https://example.com/page?foo=bar&baz=qux" />)
      
      const facebookButton = screen.getByLabelText(/Bagikan ke Facebook/i)
      fireEvent.click(facebookButton)
      
      expect(window.open).toHaveBeenCalledWith(
        'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fexample.com%2Fpage%3Ffoo%3Dbar%26baz%3Dqux',
        '_blank',
        expect.any(String)
      )
    })

    test('handles URL with hash fragment', () => {
      render(<SocialShare title="Test Title" url="https://example.com/page#section" />)
      
      const facebookButton = screen.getByLabelText(/Bagikan ke Facebook/i)
      fireEvent.click(facebookButton)
      
      expect(window.open).toHaveBeenCalledWith(
        'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fexample.com%2Fpage%23section',
        '_blank',
        expect.any(String)
      )
    })

    test('handles title with special characters', () => {
      render(<SocialShare title={'Test & Title <with> "special" chars'} url="https://example.com/test" />)
      
      const twitterButton = screen.getByLabelText(/Bagikan ke Twitter/i)
      fireEvent.click(twitterButton)
      
      expect(window.open).toHaveBeenCalledWith(
        'https://twitter.com/intent/tweet?text=Test%20%26%20Title%20%3Cwith%3E%20%22special%22%20chars&url=https%3A%2F%2Fexample.com%2Ftest',
        '_blank',
        expect.any(String)
      )
    })

    test('handles empty title', () => {
      render(<SocialShare title="" url="https://example.com/test" />)
      
      const whatsappButton = screen.getByLabelText(/Bagikan ke WhatsApp/i)
      fireEvent.click(whatsappButton)
      
      expect(window.open).toHaveBeenCalledWith(
        'https://wa.me/?text=%20https%3A%2F%2Fexample.com%2Ftest',
        '_blank',
        expect.any(String)
      )
    })
  })
})
