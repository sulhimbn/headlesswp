import { render, screen, fireEvent, act } from '@testing-library/react'
import SocialShare from '@/components/ui/SocialShare'

const mockWindowOpen = jest.fn()
jest.mock('@/lib/api/config', () => ({ SITE_URL: 'https://example.com' }))

describe('SocialShare Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockWindowOpen.mockClear()
    global.window.open = mockWindowOpen
  })

  describe('Rendering', () => {
    test('renders social share container', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBe(4)
    })

    test('renders Facebook button', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const facebookButton = screen.getByRole('button', { name: /Bagikan ke Facebook/i })
      expect(facebookButton).toBeInTheDocument()
    })

    test('renders Twitter button', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const twitterButton = screen.getByRole('button', { name: /Bagikan ke Twitter/i })
      expect(twitterButton).toBeInTheDocument()
    })

    test('renders WhatsApp button', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const whatsappButton = screen.getByRole('button', { name: /Bagikan ke WhatsApp/i })
      expect(whatsappButton).toBeInTheDocument()
    })

    test('renders copy link button', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const copyButton = screen.getByRole('button', { name: 'Salin tautan' })
      expect(copyButton).toBeInTheDocument()
    })

    test('renders all platform icons', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(4)
    })

    test('applies custom className', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" className="custom-class" />)
      const container = document.querySelector('[class="custom-class"]')
      expect(container).toBeInTheDocument()
    })

    test('renders with flex layout', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const flexContainer = document.querySelector('[class="flex items-center gap-3"]')
      expect(flexContainer).toBeInTheDocument()
    })
  })

  describe('Share Button Click Handlers', () => {
    test('opens Facebook share dialog on click', async () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const facebookButton = screen.getByRole('button', { name: /Bagikan ke Facebook/i })
      
      fireEvent.click(facebookButton)
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fexample.com%2Ftest',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('opens Twitter share dialog on click with title', async () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const twitterButton = screen.getByRole('button', { name: /Bagikan ke Twitter/i })
      
      fireEvent.click(twitterButton)
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://twitter.com/intent/tweet?text=Test%20Title&url=https%3A%2F%2Fexample.com%2Ftest',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('opens WhatsApp share dialog on click', async () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const whatsappButton = screen.getByRole('button', { name: /Bagikan ke WhatsApp/i })
      
      fireEvent.click(whatsappButton)
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://wa.me/?text=Test%20Title%20https%3A%2F%2Fexample.com%2Ftest',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('encodes special characters in share URLs', async () => {
      render(<SocialShare title="Test & Special <Chars>" url="https://example.com/test" />)
      const twitterButton = screen.getByRole('button', { name: /Bagikan ke Twitter/i })
      
      fireEvent.click(twitterButton)
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('Test%20%26%20Special%20%3CChars%3E'),
        '_blank',
        expect.any(String)
      )
    })
  })

  describe('Copy Link Functionality', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: jest.fn().mockResolvedValue(undefined),
        },
        configurable: true,
      })
    })

    test('copies URL to clipboard when clicking copy button', async () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const copyButton = screen.getByRole('button', { name: 'Salin tautan' })
      
      await act(async () => {
        fireEvent.click(copyButton)
      })
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://example.com/test')
    })

    test('shows check icon after copying', async () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const copyButton = screen.getByRole('button', { name: 'Salin tautan' })
      
      await act(async () => {
        fireEvent.click(copyButton)
      })
      
      const checkButton = screen.getByRole('button', { name: 'Tautan disalin' })
      expect(checkButton).toBeInTheDocument()
    })

    test('updates aria-label after copying', async () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const copyButton = screen.getByRole('button', { name: 'Salin tautan' })
      
      await act(async () => {
        fireEvent.click(copyButton)
      })
      
      expect(screen.queryByRole('button', { name: 'Salin tautan' })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Tautan disalin' })).toBeInTheDocument()
    })

    test('resets to link icon after timeout', async () => {
      jest.useFakeTimers()
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const copyButton = screen.getByRole('button', { name: 'Salin tautan' })
      
      await act(async () => {
        fireEvent.click(copyButton)
      })
      
      expect(screen.getByRole('button', { name: 'Tautan disalin' })).toBeInTheDocument()
      
      await act(async () => {
        jest.advanceTimersByTime(2000)
      })
      
      expect(screen.getByRole('button', { name: 'Salin tautan' })).toBeInTheDocument()
      
      jest.useRealTimers()
    })

    test('falls back to execCommand when clipboard API is unavailable', async () => {
      Object.defineProperty(document, 'execCommand', {
        value: jest.fn().mockReturnValue(true),
        configurable: true,
      })
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        configurable: true,
      })
      
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const copyButton = screen.getByRole('button', { name: 'Salin tautan' })
      
      await act(async () => {
        fireEvent.click(copyButton)
      })
      
      expect(document.execCommand).toHaveBeenCalledWith('copy')
    })
  })

  describe('URL Handling', () => {
    test('uses full URL when starts with http', async () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const twitterButton = screen.getByRole('button', { name: /Bagikan ke Twitter/i })
      
      fireEvent.click(twitterButton)
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('https%3A%2F%2Fexample.com%2Ftest'),
        '_blank',
        expect.any(String)
      )
    })

    test('prepends SITE_URL when URL does not start with http', async () => {
      render(<SocialShare title="Test Title" url="/test" />)
      const twitterButton = screen.getByRole('button', { name: /Bagikan ke Twitter/i })
      
      fireEvent.click(twitterButton)
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('https%3A%2F%2Fexample.com%2Ftest'),
        '_blank',
        expect.any(String)
      )
    })
  })

  describe('Button Styling', () => {
    test('social buttons have rounded-full class', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveClass('rounded-full')
      })
    })

    test('Facebook button has hover color class', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const facebookButton = screen.getByRole('button', { name: /Bagikan ke Facebook/i })
      expect(facebookButton).toHaveClass('hover:bg-[#1877F2]')
    })

    test('Twitter button has hover color class', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const twitterButton = screen.getByRole('button', { name: /Bagikan ke Twitter/i })
      expect(twitterButton).toHaveClass('hover:bg-[#1DA1F2]')
    })

    test('WhatsApp button has hover color class', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const whatsappButton = screen.getByRole('button', { name: /Bagikan ke WhatsApp/i })
      expect(whatsappButton).toHaveClass('hover:bg-[#25D366]')
    })

    test('copy button shows primary hover color', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const copyButton = screen.getByRole('button', { name: 'Salin tautan' })
      expect(copyButton).toHaveClass('hover:bg-[hsl(var(--color-primary))]')
    })

    test('copy button shows success color when copied', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: jest.fn().mockResolvedValue(undefined),
        },
        configurable: true,
      })
      
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const copyButton = screen.getByRole('button', { name: 'Salin tautan' })
      
      await act(async () => {
        fireEvent.click(copyButton)
      })
      
      const checkButton = screen.getByRole('button', { name: 'Tautan disalin' })
      expect(checkButton).toHaveClass('bg-[hsl(var(--color-success))]')
    })
  })

  describe('Accessibility', () => {
    test('all buttons have aria-label', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label')
      })
    })

    test('buttons have focus styles', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveClass('focus:outline-none', 'focus:ring-2')
        expect(button).toHaveClass('focus:ring-[hsl(var(--color-primary))]')
        expect(button).toHaveClass('focus:ring-offset-2')
      })
    })

    test('buttons are focusable', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).not.toBeDisabled()
      })
    })

    test('SVG icons have aria-hidden', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const svgs = document.querySelectorAll('svg')
      svgs.forEach(svg => {
        expect(svg).toHaveAttribute('aria-hidden', 'true')
      })
    })
  })

  describe('Icon Rendering', () => {
    test('renders link icon by default for copy button', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const svgs = document.querySelectorAll('svg')
      const linkSvg = Array.from(svgs).find(svg => 
        svg.getAttribute('aria-hidden') === 'true' &&
        svg.classList.contains('w-5') &&
        svg.classList.contains('h-5')
      )
      expect(linkSvg).toBeInTheDocument()
    })

    test('renders check icon after copying', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: jest.fn().mockResolvedValue(undefined),
        },
        configurable: true,
      })
      
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const copyButton = screen.getByRole('button', { name: 'Salin tautan' })
      
      await act(async () => {
        fireEvent.click(copyButton)
      })
      
      const checkSvg = document.querySelector('svg[aria-hidden="true"]')
      expect(checkSvg).toBeInTheDocument()
    })
  })

  describe('Memoization', () => {
    test('re-renders when title changes', () => {
      const { rerender, getByRole } = render(
        <SocialShare title="Initial Title" url="https://example.com/test" />
      )
      const twitterButton = getByRole('button', { name: /Bagikan ke Twitter/i })
      
      fireEvent.click(twitterButton)
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('Initial%20Title'),
        '_blank',
        expect.any(String)
      )
      
      rerender(<SocialShare title="New Title" url="https://example.com/test" />)
      
      fireEvent.click(twitterButton)
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('New%20Title'),
        '_blank',
        expect.any(String)
      )
    })

    test('re-renders when url changes', () => {
      const { rerender, getByRole } = render(
        <SocialShare title="Test Title" url="https://example.com/first" />
      )
      const twitterButton = getByRole('button', { name: /Bagikan ke Twitter/i })
      
      fireEvent.click(twitterButton)
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('example.com%2Ffirst'),
        '_blank',
        expect.any(String)
      )
      
      rerender(<SocialShare title="Test Title" url="https://example.com/second" />)
      
      fireEvent.click(twitterButton)
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('example.com%2Fsecond'),
        '_blank',
        expect.any(String)
      )
    })
  })

  describe('Edge Cases', () => {
    test('handles empty title', async () => {
      render(<SocialShare title="" url="https://example.com/test" />)
      const twitterButton = screen.getByRole('button', { name: /Bagikan ke Twitter/i })
      
      fireEvent.click(twitterButton)
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('text='),
        '_blank',
        expect.any(String)
      )
    })

    test('handles very long title', async () => {
      const longTitle = 'A'.repeat(500)
      render(<SocialShare title={longTitle} url="https://example.com/test" />)
      const twitterButton = screen.getByRole('button', { name: /Bagikan ke Twitter/i })
      
      fireEvent.click(twitterButton)
      
      expect(mockWindowOpen).toHaveBeenCalled()
    })

    test('handles special characters in URL', async () => {
      render(<SocialShare title="Test" url="https://example.com/test?foo=bar&baz=qux" />)
      const twitterButton = screen.getByRole('button', { name: /Bagikan ke Twitter/i })
      
      fireEvent.click(twitterButton)
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('example.com%2Ftest%3Ffoo%3Dbar%26baz%3Dqux'),
        '_blank',
        expect.any(String)
      )
    })

    test('handles unicode characters in title', async () => {
      render(<SocialShare title="Judul Test Indonesia" url="https://example.com/test" />)
      const twitterButton = screen.getByRole('button', { name: /Bagikan ke Twitter/i })
      
      fireEvent.click(twitterButton)
      
      expect(mockWindowOpen).toHaveBeenCalled()
    })
  })
})
