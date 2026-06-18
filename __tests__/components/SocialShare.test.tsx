import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import SocialShare from '@/components/ui/SocialShare'

describe('SocialShare Component', () => {
  const mockTitle = 'Test Article Title'
  const mockUrl = '/test-article'

  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  describe('Rendering', () => {
    test('renders social share buttons', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      expect(screen.getByLabelText('Bagikan ke Facebook')).toBeInTheDocument()
      expect(screen.getByLabelText('Bagikan ke Twitter')).toBeInTheDocument()
      expect(screen.getByLabelText('Bagikan ke WhatsApp')).toBeInTheDocument()
    })

    test('renders copy link button', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      expect(screen.getByLabelText('Salin tautan')).toBeInTheDocument()
    })

    test('renders with custom className', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} className="custom-class" />)
      
      const container = screen.getByText(mockTitle).parentElement
      expect(container?.parentElement).toHaveClass('custom-class')
    })

    test('renders all platform buttons', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(4)
    })
  })

  describe('Social Share', () => {
    test('opens Facebook share window', () => {
      const mockOpen = jest.fn()
      window.open = mockOpen
      
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const facebookButton = screen.getByLabelText('Bagikan ke Facebook')
      fireEvent.click(facebookButton)
      
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('facebook.com/sharer'),
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('opens Twitter share window', () => {
      const mockOpen = jest.fn()
      window.open = mockOpen
      
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const twitterButton = screen.getByLabelText('Bagikan ke Twitter')
      fireEvent.click(twitterButton)
      
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('twitter.com/intent/tweet'),
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('opens WhatsApp share window', () => {
      const mockOpen = jest.fn()
      window.open = mockOpen
      
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const whatsappButton = screen.getByLabelText('Bagikan ke WhatsApp')
      fireEvent.click(whatsappButton)
      
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('wa.me'),
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('encodes title and url in share URLs', () => {
      const mockOpen = jest.fn()
      window.open = mockOpen
      
      const specialTitle = 'Test & Title <Special>'
      render(<SocialShare title={specialTitle} url={mockUrl} />)
      
      const twitterButton = screen.getByLabelText('Bagikan ke Twitter')
      fireEvent.click(twitterButton)
      
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent(specialTitle)),
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })
  })

  describe('Copy Link', () => {
    test('copies full URL to clipboard using navigator.clipboard', async () => {
      const mockWriteText = jest.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
      })
      
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const copyButton = screen.getByLabelText('Salin tautan')
      fireEvent.click(copyButton)
      
      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalled()
      })
    })

    test('shows success state after copying', async () => {
      const mockWriteText = jest.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
      })
      
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const copyButton = screen.getByLabelText('Salin tautan')
      fireEvent.click(copyButton)
      
      await waitFor(() => {
        expect(screen.getByLabelText('Tautan disalin')).toBeInTheDocument()
      })
    })

    test('falls back to execCommand when clipboard API fails', async () => {
      const mockWriteText = jest.fn().mockRejectedValue(new Error('Clipboard API not available'))
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
      })

      const mockSelect = jest.fn()
      const mockExecCommand = jest.fn().mockReturnValue(true)
      
      const mockInput = document.createElement('input')
      mockInput.select = mockSelect
      
      jest.spyOn(document, 'createElement').mockReturnValue(mockInput as any)
      jest.spyOn(document, 'body', 'get').mockReturnValue(document.body)
      
      document.execCommand = mockExecCommand
      
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const copyButton = screen.getByLabelText('Salin tautan')
      fireEvent.click(copyButton)
      
      await waitFor(() => {
        expect(mockExecCommand).toHaveBeenCalledWith('copy')
      })
    })

    test('resets copied state after timeout', async () => {
      const mockWriteText = jest.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
      })
      
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const copyButton = screen.getByLabelText('Salin tautan')
      fireEvent.click(copyButton)
      
      await waitFor(() => {
        expect(screen.getByLabelText('Tautan disalin')).toBeInTheDocument()
      })
      
      act(() => {
        jest.advanceTimersByTime(2000)
      })
      
      await waitFor(() => {
        expect(screen.getByLabelText('Salin tautan')).toBeInTheDocument()
      })
    })
  })

  describe('URL Handling', () => {
    test('prepends site URL for relative URLs', () => {
      const mockOpen = jest.fn()
      window.open = mockOpen
      
      render(<SocialShare title={mockTitle} url="/relative-path" />)
      
      const twitterButton = screen.getByLabelText('Bagikan ke Twitter')
      fireEvent.click(twitterButton)
      
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('http'),
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('uses absolute URL as-is', () => {
      const mockOpen = jest.fn()
      window.open = mockOpen
      
      render(<SocialShare title={mockTitle} url="https://example.com/article" />)
      
      const twitterButton = screen.getByLabelText('Bagikan ke Twitter')
      fireEvent.click(twitterButton)
      
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('https://example.com/article'),
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })
  })

  describe('Accessibility', () => {
    test('buttons have proper aria-label', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      expect(screen.getByLabelText('Bagikan ke Facebook')).toBeInTheDocument()
      expect(screen.getByLabelText('Bagikan ke Twitter')).toBeInTheDocument()
      expect(screen.getByLabelText('Bagikan ke WhatsApp')).toBeInTheDocument()
      expect(screen.getByLabelText('Salin tautan')).toBeInTheDocument()
    })

    test('buttons have focus styles', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveClass('focus:outline-none')
        expect(button).toHaveClass('focus:ring-2')
      })
    })

    test('has visible title for screen readers', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const container = document.querySelector('div[class*="flex"]')
      expect(container).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    test('buttons have surface color', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const facebookButton = screen.getByLabelText('Bagikan ke Facebook')
      expect(facebookButton).toHaveClass('bg-[hsl(var(--color-surface))]')
    })

    test('buttons have hover transition', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveClass('transition-colors')
      })
    })

    test('Facebook button has correct hover color', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const facebookButton = screen.getByLabelText('Bagikan ke Facebook')
      expect(facebookButton).toHaveClass('hover:bg-[#1877F2]')
    })

    test('Twitter button has correct hover color', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const twitterButton = screen.getByLabelText('Bagikan ke Twitter')
      expect(twitterButton).toHaveClass('hover:bg-[#1DA1F2]')
    })

    test('WhatsApp button has correct hover color', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const whatsappButton = screen.getByLabelText('Bagikan ke WhatsApp')
      expect(whatsappButton).toHaveClass('hover:bg-[#25D366]')
    })
  })

  describe('Icons', () => {
    test('renders Facebook icon', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const facebookButton = screen.getByLabelText('Bagikan ke Facebook')
      const svg = facebookButton.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    test('icons have correct size', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const facebookButton = screen.getByLabelText('Bagikan ke Facebook')
      const svg = facebookButton.querySelector('svg')
      expect(svg).toHaveClass('w-5', 'h-5')
    })
  })
})