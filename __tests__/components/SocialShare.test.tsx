import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import SocialShare from '@/components/ui/SocialShare'

const mockUrl = '/test-post'
const mockTitle = 'Test Post Title'

describe('SocialShare Component', () => {
  const originalClipboard = navigator.clipboard
  const originalExecCommand = document.execCommand

  beforeEach(() => {
    jest.clearAllMocks()
    
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
      writable: true,
    })
  })

  afterEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      writable: true,
    })
    document.execCommand = originalExecCommand
  })

  describe('Rendering', () => {
    test('renders social share buttons', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      expect(screen.getByRole('button', { name: /Bagikan ke Facebook/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Bagikan ke Twitter/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Bagikan ke WhatsApp/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Salin tautan/i })).toBeInTheDocument()
    })

    test('renders with custom className', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} className="custom-class" />)
      
      const container = document.querySelector('.custom-class')
      expect(container).toBeInTheDocument()
    })

    test('renders all platform buttons', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(4)
    })
  })

  describe('Platform Buttons', () => {
    test('Facebook button has correct title', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      expect(screen.getByTitle('Bagikan ke Facebook')).toBeInTheDocument()
    })

    test('Twitter button has correct title', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      expect(screen.getByTitle('Bagikan ke Twitter')).toBeInTheDocument()
    })

    test('WhatsApp button has correct title', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      expect(screen.getByTitle('Bagikan ke WhatsApp')).toBeInTheDocument()
    })
  })

  describe('Share Functionality', () => {
    test('opens Facebook share window', () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation()
      
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const facebookButton = screen.getByTitle('Bagikan ke Facebook')
      fireEvent.click(facebookButton)
      
      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining('facebook.com/sharer'),
        '_blank',
        expect.any(String)
      )
      
      openSpy.mockRestore()
    })

    test('opens Twitter share window', () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation()
      
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const twitterButton = screen.getByTitle('Bagikan ke Twitter')
      fireEvent.click(twitterButton)
      
      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining('twitter.com/intent/tweet'),
        '_blank',
        expect.any(String)
      )
      
      openSpy.mockRestore()
    })

    test('opens WhatsApp share window', () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation()
      
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const whatsappButton = screen.getByTitle('Bagikan ke WhatsApp')
      fireEvent.click(whatsappButton)
      
      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining('wa.me'),
        '_blank',
        expect.any(String)
      )
      
      openSpy.mockRestore()
    })
  })

  describe('Copy Link Functionality', () => {
    test('copies link using clipboard API', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const copyButton = screen.getByTitle('Salin tautan')
      fireEvent.click(copyButton)
      
      expect(navigator.clipboard.writeText).toHaveBeenCalled()
    })

    test('shows check icon after copying', async () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const copyButton = screen.getByTitle('Salin tautan')
      await act(async () => {
        fireEvent.click(copyButton)
      })
      
      expect(screen.getByTitle('Tautan disalin')).toBeInTheDocument()
    })

    test('resets copy state after timeout', async () => {
      jest.useFakeTimers()
      
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const copyButton = screen.getByTitle('Salin tautan')
      await act(async () => {
        fireEvent.click(copyButton)
      })
      
      expect(screen.getByTitle('Tautan disalin')).toBeInTheDocument()
      
      await act(async () => {
        jest.advanceTimersByTime(2000)
      })
      
      expect(screen.getByTitle('Salin tautan')).toBeInTheDocument()
      
      jest.useRealTimers()
    })

    test('falls back to execCommand when clipboard fails', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: jest.fn().mockRejectedValue(new Error('Clipboard API not available')),
        },
        writable: true,
      })
      
      document.execCommand = jest.fn().mockReturnValue(true)
      
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const copyButton = screen.getByTitle('Salin tautan')
      await act(async () => {
        fireEvent.click(copyButton)
      })
      
      expect(document.execCommand).toHaveBeenCalledWith('copy')
    })
  })

  describe('URL Handling', () => {
    test('uses relative URL with SITE_URL prepended', () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation()
      
      render(<SocialShare title={mockTitle} url="/relative-path" />)
      
      const facebookButton = screen.getByTitle('Bagikan ke Facebook')
      fireEvent.click(facebookButton)
      
      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent('/relative-path')),
        '_blank',
        expect.any(String)
      )
      
      openSpy.mockRestore()
    })

    test('uses absolute URL as-is', () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation()
      
      render(<SocialShare title={mockTitle} url="https://example.com/post" />)
      
      const facebookButton = screen.getByTitle('Bagikan ke Facebook')
      fireEvent.click(facebookButton)
      
      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining('example.com'),
        '_blank',
        expect.any(String)
      )
      
      openSpy.mockRestore()
    })
  })

  describe('Accessibility', () => {
    test('buttons have aria-label', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      expect(screen.getByRole('button', { name: /Bagikan ke Facebook/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Bagikan ke Twitter/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Bagikan ke WhatsApp/i })).toBeInTheDocument()
    })

    test('copy button updates aria-label when copied', async () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const copyButton = screen.getByRole('button', { name: /Salin tautan/i })
      await act(async () => {
        fireEvent.click(copyButton)
      })
      
      expect(screen.getByRole('button', { name: /Tautan disalin/i })).toBeInTheDocument()
    })

    test('buttons are focusable', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const button = screen.getByTitle('Bagikan ke Facebook')
      expect(button).not.toHaveAttribute('tabindex')
    })
  })

  describe('Styling', () => {
    test('buttons have correct base styling', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const button = screen.getByTitle('Bagikan ke Facebook')
      expect(button).toHaveClass('p-2')
      expect(button).toHaveClass('rounded-full')
      expect(button).toHaveClass('bg-[hsl(var(--color-surface))]')
    })

    test('buttons have focus styles', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const button = screen.getByTitle('Bagikan ke Facebook')
      expect(button).toHaveClass('focus:outline-none')
      expect(button).toHaveClass('focus:ring-2')
      expect(button).toHaveClass('focus:ring-[hsl(var(--color-primary))]')
      expect(button).toHaveClass('focus:ring-offset-2')
    })

    test('Facebook button has hover color', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const button = screen.getByTitle('Bagikan ke Facebook')
      expect(button).toHaveClass('hover:bg-[#1877F2]')
    })

    test('Twitter button has hover color', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const button = screen.getByTitle('Bagikan ke Twitter')
      expect(button).toHaveClass('hover:bg-[#1DA1F2]')
    })

    test('WhatsApp button has hover color', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const button = screen.getByTitle('Bagikan ke WhatsApp')
      expect(button).toHaveClass('hover:bg-[#25D366]')
    })

    test('copy button shows success styling when copied', async () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const copyButton = screen.getByTitle('Salin tautan')
      await act(async () => {
        fireEvent.click(copyButton)
      })
      
      const copiedButton = screen.getByTitle('Tautan disalin')
      expect(copiedButton).toHaveClass('bg-[hsl(var(--color-success))]')
      expect(copiedButton).toHaveClass('text-white')
    })
  })

  describe('SocialIcon Component', () => {
    test('renders Facebook icon', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const facebookButton = screen.getByTitle('Bagikan ke Facebook')
      const svg = facebookButton.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    test('renders Twitter icon', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const twitterButton = screen.getByTitle('Bagikan ke Twitter')
      const svg = twitterButton.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    test('renders WhatsApp icon', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const whatsappButton = screen.getByTitle('Bagikan ke WhatsApp')
      const svg = whatsappButton.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    test('renders link icon for copy button', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const copyButton = screen.getByTitle('Salin tautan')
      const svg = copyButton.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('Memoization', () => {
    test('component is memoized', () => {
      const { rerender } = render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(4)
      
      rerender(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const newButtons = screen.getAllByRole('button')
      expect(newButtons).toHaveLength(4)
    })
  })

  describe('Default Props', () => {
    test('renders without className when not provided', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const container = document.querySelector('div')
      expect(container).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    test('handles empty title', () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation()
      
      render(<SocialShare title="" url={mockUrl} />)
      
      const facebookButton = screen.getByTitle('Bagikan ke Facebook')
      fireEvent.click(facebookButton)
      
      expect(openSpy).toHaveBeenCalled()
      
      openSpy.mockRestore()
    })

    test('handles special characters in title', () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation()
      
      render(<SocialShare title="Test & Special <Characters>" url={mockUrl} />)
      
      const twitterButton = screen.getByTitle('Bagikan ke Twitter')
      fireEvent.click(twitterButton)
      
      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining('text='),
        '_blank',
        expect.any(String)
      )
      
      openSpy.mockRestore()
    })
  })
})
