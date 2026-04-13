import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SocialShare from '@/components/ui/SocialShare'

describe('SocialShare Component', () => {
  const defaultProps = {
    title: 'Test Article',
    url: 'https://example.com/test-article',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    global.window = Object.create(window)
    Object.defineProperty(window, 'open', {
      writable: true,
      value: jest.fn(),
    })
  })

  describe('Rendering', () => {
    test('renders share buttons for all platforms', () => {
      render(<SocialShare {...defaultProps} />)
      
      expect(screen.getByRole('button', { name: /Facebook/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Twitter/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /WhatsApp/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Salin/i })).toBeInTheDocument()
    })

    test('renders with custom className', () => {
      render(<SocialShare {...defaultProps} className="custom-class" />)
      const container = screen.getByText((content, element) => {
        return element?.closest('div')?.classList.contains('custom-class')
      })
      expect(container).toBeInTheDocument()
    })

    test('renders all platform buttons', () => {
      render(<SocialShare {...defaultProps} />)
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(4)
    })
  })

  describe('Share Functionality', () => {
    test('opens Facebook share window', () => {
      render(<SocialShare {...defaultProps} />)
      
      const facebookButton = screen.getByRole('button', { name: /Facebook/i })
      fireEvent.click(facebookButton)
      
      expect(window.open).toHaveBeenCalled()
    })

    test('opens Twitter share window', () => {
      render(<SocialShare {...defaultProps} />)
      
      const twitterButton = screen.getByRole('button', { name: /Twitter/i })
      fireEvent.click(twitterButton)
      
      expect(window.open).toHaveBeenCalled()
    })

    test('opens WhatsApp share window', () => {
      render(<SocialShare {...defaultProps} />)
      
      const whatsappButton = screen.getByRole('button', { name: /WhatsApp/i })
      fireEvent.click(whatsappButton)
      
      expect(window.open).toHaveBeenCalled()
    })

    test('opens share window with encoded parameters', () => {
      render(<SocialShare {...defaultProps} />)
      
      const twitterButton = screen.getByRole('button', { name: /Twitter/i })
      fireEvent.click(twitterButton)
      
      const call = (window.open as jest.Mock).mock.calls[0]
      expect(call[0]).toContain('Test%20Article')
      expect(call[0]).toContain('example.com')
    })
  })

  describe('Copy Link Functionality', () => {
    test('shows copied state after clicking copy button', async () => {
      const clipboardMock = jest.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: clipboardMock },
        writable: true,
      })
      
      render(<SocialShare {...defaultProps} />)
      
      const copyButton = screen.getByRole('button', { name: /Salin tautan/i })
      fireEvent.click(copyButton)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Tautan disalin/i })).toBeInTheDocument()
      })
    })

    test('falls back to execCommand when clipboard API unavailable', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true,
      })
      document.execCommand = jest.fn().mockReturnValue(true)
      
      render(<SocialShare {...defaultProps} />)
      
      const copyButton = screen.getByRole('button', { name: /Salin tautan/i })
      fireEvent.click(copyButton)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Tautan disalin/i })).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    test('has proper aria-label for Facebook button', () => {
      render(<SocialShare {...defaultProps} />)
      expect(screen.getByRole('button', { name: /Bagikan ke Facebook/i })).toBeInTheDocument()
    })

    test('has proper aria-label for Twitter button', () => {
      render(<SocialShare {...defaultProps} />)
      expect(screen.getByRole('button', { name: /Bagikan ke Twitter/i })).toBeInTheDocument()
    })

    test('has proper aria-label for WhatsApp button', () => {
      render(<SocialShare {...defaultProps} />)
      expect(screen.getByRole('button', { name: /Bagikan ke WhatsApp/i })).toBeInTheDocument()
    })

    test('has proper aria-label for copy button', () => {
      render(<SocialShare {...defaultProps} />)
      expect(screen.getByRole('button', { name: /Salin tautan/i })).toBeInTheDocument()
    })

    test('buttons are keyboard accessible', () => {
      render(<SocialShare {...defaultProps} />)
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('disabled')
      })
    })

    test('buttons have focus styles', () => {
      render(<SocialShare {...defaultProps} />)
      const button = screen.getAllByRole('button')[0]
      expect(button).toHaveClass('focus:outline-none')
      expect(button).toHaveClass('focus:ring-2')
    })
  })

  describe('Icon Rendering', () => {
    test('renders SVG icons for each platform', () => {
      render(<SocialShare {...defaultProps} />)
      const facebookButton = screen.getByRole('button', { name: /Facebook/i })
      expect(facebookButton.querySelector('svg')).toBeInTheDocument()
    })
  })
})
