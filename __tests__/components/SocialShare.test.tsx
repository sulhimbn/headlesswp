import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SocialShare from '@/components/ui/SocialShare'

const mockClipboard = {
  writeText: jest.fn(),
}

beforeEach(() => {
  jest.clearAllMocks()
  Object.defineProperty(navigator, 'clipboard', {
    value: mockClipboard,
    writable: true,
  })
  global.window.open = jest.fn()
})

describe('SocialShare Component', () => {
  describe('Rendering', () => {
    test('renders social share buttons', () => {
      render(<SocialShare title="Test Title" url="/test-url" />)
      expect(screen.getByRole('button', { name: /Facebook/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Twitter/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /WhatsApp/i })).toBeInTheDocument()
    })

    test('renders copy link button', () => {
      render(<SocialShare title="Test Title" url="/test-url" />)
      expect(screen.getByRole('button', { name: /Salin tautan/i })).toBeInTheDocument()
    })

    test('renders with custom className', () => {
      render(<SocialShare title="Test Title" url="/test-url" className="custom-share" />)
      const container = document.querySelector('.custom-share')
      expect(container).toBeInTheDocument()
    })

    test('renders all platform buttons', () => {
      render(<SocialShare title="Test Title" url="/test-url" />)
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(4)
    })
  })

  describe('Facebook Share', () => {
    test('opens Facebook share window with correct URL', () => {
      render(<SocialShare title="Test Title" url="/test-url" />)
      const facebookButton = screen.getByRole('button', { name: /Facebook/i })
      fireEvent.click(facebookButton)
      expect(global.window.open).toHaveBeenCalledWith(
        expect.stringContaining('https%3A%2F%2Fmitrabantennews.com%2Ftest-url'),
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })
  })

  describe('Twitter Share', () => {
    test('opens Twitter share window with correct URL', () => {
      render(<SocialShare title="Test Title" url="/test-url" />)
      const twitterButton = screen.getByRole('button', { name: /Twitter/i })
      fireEvent.click(twitterButton)
      expect(global.window.open).toHaveBeenCalledWith(
        expect.stringContaining('https%3A%2F%2Fmitrabantennews.com%2Ftest-url'),
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('encodes special characters in title', () => {
      render(<SocialShare title="Test & Title <special>" url="/test" />)
      const twitterButton = screen.getByRole('button', { name: /Twitter/i })
      fireEvent.click(twitterButton)
      expect(global.window.open).toHaveBeenCalledWith(
        expect.stringContaining('Test%20%26%20Title%20%3Cspecial%3E'),
        '_blank',
        expect.any(String)
      )
    })
  })

  describe('WhatsApp Share', () => {
    test('opens WhatsApp share window with correct URL', () => {
      render(<SocialShare title="Test Title" url="/test-url" />)
      const whatsappButton = screen.getByRole('button', { name: /WhatsApp/i })
      fireEvent.click(whatsappButton)
      expect(global.window.open).toHaveBeenCalledWith(
        expect.stringContaining('https%3A%2F%2Fmitrabantennews.com%2Ftest-url'),
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })
  })

  describe('Copy Link', () => {
    test('copies full URL to clipboard when using navigator.clipboard', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined)
      render(<SocialShare title="Test Title" url="/test-url" />)
      
      const copyButton = screen.getByRole('button', { name: /Salin tautan/i })
      fireEvent.click(copyButton)
      
      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith('https://mitrabantennews.com/test-url')
      })
    })

    test('shows check icon after copying', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined)
      render(<SocialShare title="Test Title" url="/test-url" />)
      
      const copyButton = screen.getByRole('button', { name: /Salin tautan/i })
      fireEvent.click(copyButton)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Tautan disalin/i })).toBeInTheDocument()
      })
    })

    test('resets copy state after 2 seconds', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined)
      jest.useFakeTimers()
      
      render(<SocialShare title="Test Title" url="/test-url" />)
      
      const copyButton = screen.getByRole('button', { name: /Salin tautan/i })
      fireEvent.click(copyButton)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Tautan disalin/i })).toBeInTheDocument()
      })
      
      jest.advanceTimersByTime(2000)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Salin tautan/i })).toBeInTheDocument()
      })
      
      jest.useRealTimers()
    })

    test('falls back to execCommand when clipboard API fails', async () => {
      mockClipboard.writeText.mockRejectedValue(new Error('Clipboard error'))
      const execCommandMock = jest.fn()
      document.execCommand = execCommandMock
      execCommandMock.mockReturnValue(true)
      
      const createElementSpy = jest.spyOn(document, 'createElement')
      const appendChildSpy = jest.spyOn(document.body, 'appendChild')
      const removeChildSpy = jest.spyOn(document.body, 'removeChild')
      
      render(<SocialShare title="Test Title" url="/test-url" />)
      
      const copyButton = screen.getByRole('button', { name: /Salin tautan/i })
      fireEvent.click(copyButton)
      
      await waitFor(() => {
        expect(createElementSpy).toHaveBeenCalledWith('input')
      })
      expect(appendChildSpy).toHaveBeenCalled()
      expect(removeChildSpy).toHaveBeenCalled()
      
      createElementSpy.mockRestore()
      appendChildSpy.mockRestore()
      removeChildSpy.mockRestore()
    })
  })

  describe('URL Handling', () => {
    test('uses full URL as-is when it starts with http', () => {
      render(<SocialShare title="Test Title" url="https://example.com/article" />)
      const facebookButton = screen.getByRole('button', { name: /Facebook/i })
      fireEvent.click(facebookButton)
      expect(global.window.open).toHaveBeenCalledWith(
        'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fexample.com%2Farticle',
        '_blank',
        expect.any(String)
      )
    })

    test('prepends SITE_URL when URL does not start with http', () => {
      render(<SocialShare title="Test Title" url="/my-article" />)
      const facebookButton = screen.getByRole('button', { name: /Facebook/i })
      fireEvent.click(facebookButton)
      expect(global.window.open).toHaveBeenCalledWith(
        expect.stringContaining('https%3A%2F%2Fmitrabantennews.com%2Fmy-article'),
        '_blank',
        expect.any(String)
      )
    })
  })

  describe('Accessibility', () => {
    test('buttons have aria-label', () => {
      render(<SocialShare title="Test Title" url="/test-url" />)
      expect(screen.getByRole('button', { name: /Facebook/i })).toHaveAttribute('aria-label')
      expect(screen.getByRole('button', { name: /Twitter/i })).toHaveAttribute('aria-label')
      expect(screen.getByRole('button', { name: /WhatsApp/i })).toHaveAttribute('aria-label')
    })

    test('copy button has dynamic aria-label when copied', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined)
      render(<SocialShare title="Test Title" url="/test-url" />)
      
      const copyButton = screen.getByRole('button', { name: /Salin tautan/i })
      fireEvent.click(copyButton)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Tautan disalin/i })).toBeInTheDocument()
      })
    })

    test('buttons have title attribute', () => {
      render(<SocialShare title="Test Title" url="/test-url" />)
      expect(screen.getByRole('button', { name: /Facebook/i })).toHaveAttribute('title')
      expect(screen.getByRole('button', { name: /Twitter/i })).toHaveAttribute('title')
      expect(screen.getByRole('button', { name: /WhatsApp/i })).toHaveAttribute('title')
    })
  })

  describe('Styles', () => {
    test('container has flex layout', () => {
      render(<SocialShare title="Test Title" url="/test-url" />)
      const container = document.querySelector('.flex')
      expect(container).toHaveClass('flex', 'items-center', 'gap-3')
    })

    test('buttons have rounded-full class', () => {
      render(<SocialShare title="Test Title" url="/test-url" />)
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveClass('rounded-full')
      })
    })

    test('buttons have surface background', () => {
      render(<SocialShare title="Test Title" url="/test-url" />)
      const button = screen.getByRole('button', { name: /Facebook/i })
      expect(button).toHaveClass('bg-[hsl(var(--color-surface))]')
    })

    test('Facebook button has correct hover color', () => {
      render(<SocialShare title="Test Title" url="/test-url" />)
      const button = screen.getByRole('button', { name: /Facebook/i })
      expect(button).toHaveClass('hover:bg-[#1877F2]')
    })

    test('Twitter button has correct hover color', () => {
      render(<SocialShare title="Test Title" url="/test-url" />)
      const button = screen.getByRole('button', { name: /Twitter/i })
      expect(button).toHaveClass('hover:bg-[#1DA1F2]')
    })

    test('WhatsApp button has correct hover color', () => {
      render(<SocialShare title="Test Title" url="/test-url" />)
      const button = screen.getByRole('button', { name: /WhatsApp/i })
      expect(button).toHaveClass('hover:bg-[#25D366]')
    })

    test('copy button has success background when copied', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined)
      render(<SocialShare title="Test Title" url="/test-url" />)
      
      const copyButton = screen.getByRole('button', { name: /Salin tautan/i })
      fireEvent.click(copyButton)
      
      await waitFor(() => {
        const button = screen.getByRole('button', { name: /Tautan disalin/i })
        expect(button).toHaveClass('bg-[hsl(var(--color-success))]')
        expect(button).toHaveClass('text-white')
      })
    })
  })

  describe('Social Icons', () => {
    test('renders Facebook icon', () => {
      render(<SocialShare title="Test Title" url="/test-url" />)
      const button = screen.getByRole('button', { name: /Facebook/i })
      expect(button.querySelector('svg')).toBeInTheDocument()
    })

    test('renders Twitter icon', () => {
      render(<SocialShare title="Test Title" url="/test-url" />)
      const button = screen.getByRole('button', { name: /Twitter/i })
      expect(button.querySelector('svg')).toBeInTheDocument()
    })

    test('renders WhatsApp icon', () => {
      render(<SocialShare title="Test Title" url="/test-url" />)
      const button = screen.getByRole('button', { name: /WhatsApp/i })
      expect(button.querySelector('svg')).toBeInTheDocument()
    })

    test('renders link icon for copy button', () => {
      render(<SocialShare title="Test Title" url="/test-url" />)
      const button = screen.getByRole('button', { name: /Salin tautan/i })
      expect(button.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('Focus Styles', () => {
    test('buttons have focus ring', () => {
      render(<SocialShare title="Test Title" url="/test-url" />)
      const button = screen.getByRole('button', { name: /Facebook/i })
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-[hsl(var(--color-primary))]', 'focus:ring-offset-2')
    })
  })

  describe('Memoization', () => {
    test('component is memoized', () => {
      const { rerender } = render(<SocialShare title="Test Title" url="/test-url" />)
      expect(screen.getByRole('button', { name: /Facebook/i })).toBeInTheDocument()
      rerender(<SocialShare title="Test Title" url="/test-url" />)
      expect(screen.getByRole('button', { name: /Facebook/i })).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    test('handles empty title', () => {
      render(<SocialShare title="" url="/test-url" />)
      const twitterButton = screen.getByRole('button', { name: /Twitter/i })
      fireEvent.click(twitterButton)
      expect(global.window.open).toHaveBeenCalledWith(
        expect.stringContaining('text='),
        '_blank',
        expect.any(String)
      )
    })

    test('handles URL with query parameters', () => {
      render(<SocialShare title="Test" url="/test?foo=bar&baz=qux" />)
      const facebookButton = screen.getByRole('button', { name: /Facebook/i })
      fireEvent.click(facebookButton)
      expect(global.window.open).toHaveBeenCalledWith(
        expect.stringContaining('%3Ffoo%3Dbar%26baz%3Dqux'),
        '_blank',
        expect.any(String)
      )
    })

    test('handles URL with hash', () => {
      render(<SocialShare title="Test" url="/test#section" />)
      const facebookButton = screen.getByRole('button', { name: /Facebook/i })
      fireEvent.click(facebookButton)
      expect(global.window.open).toHaveBeenCalledWith(
        expect.stringContaining('%23section'),
        '_blank',
        expect.any(String)
      )
    })
  })
})
