import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import SocialShare from '@/components/ui/SocialShare'

const mockClipboard = {
  writeText: jest.fn(),
}

const mockWindowOpen = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  jest.restoreAllMocks()
  Object.defineProperty(navigator, 'clipboard', {
    value: mockClipboard,
    writable: true,
  })
  global.window.open = mockWindowOpen
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('SocialShare Component', () => {
  const defaultProps = {
    title: 'Test Article',
    url: 'https://example.com/article',
  }

  describe('Rendering', () => {
    test('renders share buttons for all platforms', () => {
      render(<SocialShare {...defaultProps} />)
      
      expect(screen.getByLabelText('Bagikan ke Facebook')).toBeInTheDocument()
      expect(screen.getByLabelText('Bagikan ke Twitter')).toBeInTheDocument()
      expect(screen.getByLabelText('Bagikan ke WhatsApp')).toBeInTheDocument()
    })

    test('renders copy link button', () => {
      render(<SocialShare {...defaultProps} />)
      
      expect(screen.getByLabelText('Salin tautan')).toBeInTheDocument()
    })

    test('applies custom className', () => {
      render(<SocialShare {...defaultProps} className="custom-class" />)
      
      const container = document.querySelector('.custom-class')
      expect(container).toBeInTheDocument()
    })

    test('renders with default className when not provided', () => {
      render(<SocialShare {...defaultProps} />)
      
      const container = document.querySelector('.flex')
      expect(container).toBeInTheDocument()
    })
  })

  describe('Share Functionality', () => {
    test('opens Facebook share window with correct URL', () => {
      render(<SocialShare {...defaultProps} />)
      
      const facebookButton = screen.getByLabelText('Bagikan ke Facebook')
      fireEvent.click(facebookButton)
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fexample.com%2Farticle',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('opens Twitter share window with correct URL', () => {
      render(<SocialShare {...defaultProps} />)
      
      const twitterButton = screen.getByLabelText('Bagikan ke Twitter')
      fireEvent.click(twitterButton)
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://twitter.com/intent/tweet?text=Test%20Article&url=https%3A%2F%2Fexample.com%2Farticle',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('opens WhatsApp share window with correct URL', () => {
      render(<SocialShare {...defaultProps} />)
      
      const whatsappButton = screen.getByLabelText('Bagikan ke WhatsApp')
      fireEvent.click(whatsappButton)
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://wa.me/?text=Test%20Article%20https%3A%2F%2Fexample.com%2Farticle',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('encodes special characters in share URLs', () => {
      render(<SocialShare title="Test & Article <2024>" url="https://example.com/article?id=1" />)
      
      const twitterButton = screen.getByLabelText('Bagikan ke Twitter')
      fireEvent.click(twitterButton)
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://twitter.com/intent/tweet?text=Test%20%26%20Article%20%3C2024%3E&url=https%3A%2F%2Fexample.com%2Farticle%3Fid%3D1',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })
  })

  describe('Copy Link Functionality', () => {
    test('copies URL to clipboard when using clipboard API', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined)
      
      render(<SocialShare {...defaultProps} />)
      
      const copyButton = screen.getByLabelText('Salin tautan')
      fireEvent.click(copyButton)
      
      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith('https://example.com/article')
      })
    })

    test('shows checkmark after copying', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined)
      
      render(<SocialShare {...defaultProps} />)
      
      const copyButton = screen.getByLabelText('Salin tautan')
      fireEvent.click(copyButton)
      
      await waitFor(() => {
        expect(screen.getByLabelText('Tautan disalin')).toBeInTheDocument()
      })
    })

    test('updates title after copying', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined)
      
      render(<SocialShare {...defaultProps} />)
      
      const copyButton = screen.getByLabelText('Salin tautan')
      fireEvent.click(copyButton)
      
      await waitFor(() => {
        expect(screen.getByTitle('Tautan disalin')).toBeInTheDocument()
      })
    })

    test('resets to link icon after timeout', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined)
      
      render(<SocialShare {...defaultProps} />)
      
      const copyButton = screen.getByLabelText('Salin tautan')
      fireEvent.click(copyButton)
      
      await waitFor(() => {
        expect(screen.getByLabelText('Tautan disalin')).toBeInTheDocument()
      })
      
      await waitFor(() => {
        expect(screen.getByLabelText('Salin tautan')).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  describe('Accessibility', () => {
    test('buttons have proper aria-labels', () => {
      render(<SocialShare {...defaultProps} />)
      
      expect(screen.getByLabelText('Bagikan ke Facebook')).toBeInTheDocument()
      expect(screen.getByLabelText('Bagikan ke Twitter')).toBeInTheDocument()
      expect(screen.getByLabelText('Bagikan ke WhatsApp')).toBeInTheDocument()
      expect(screen.getByLabelText('Salin tautan')).toBeInTheDocument()
    })

    test('buttons have titles', () => {
      render(<SocialShare {...defaultProps} />)
      
      expect(screen.getByTitle('Bagikan ke Facebook')).toBeInTheDocument()
      expect(screen.getByTitle('Bagikan ke Twitter')).toBeInTheDocument()
      expect(screen.getByTitle('Bagikan ke WhatsApp')).toBeInTheDocument()
      expect(screen.getByTitle('Salin tautan')).toBeInTheDocument()
    })

    test('buttons are focusable', () => {
      render(<SocialShare {...defaultProps} />)
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).not.toBeDisabled()
      })
    })

    test('applies focus styles', () => {
      render(<SocialShare {...defaultProps} />)
      
      const button = screen.getByLabelText('Bagikan ke Facebook')
      expect(button).toHaveClass('focus:outline-none')
      expect(button).toHaveClass('focus:ring-2')
      expect(button).toHaveClass('focus:ring-[hsl(var(--color-primary))]')
    })
  })

  describe('Icons', () => {
    test('renders Facebook icon', () => {
      render(<SocialShare {...defaultProps} />)
      
      const facebookButton = screen.getByLabelText('Bagikan ke Facebook')
      const svg = facebookButton.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('fill', 'currentColor')
    })

    test('renders Twitter icon', () => {
      render(<SocialShare {...defaultProps} />)
      
      const twitterButton = screen.getByLabelText('Bagikan ke Twitter')
      const svg = twitterButton.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    test('renders WhatsApp icon', () => {
      render(<SocialShare {...defaultProps} />)
      
      const whatsappButton = screen.getByLabelText('Bagikan ke WhatsApp')
      const svg = whatsappButton.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    test('renders link icon initially', () => {
      render(<SocialShare {...defaultProps} />)
      
      const copyButton = screen.getByLabelText('Salin tautan')
      const svg = copyButton.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('Visual Feedback', () => {
    test('applies platform-specific hover colors', () => {
      render(<SocialShare {...defaultProps} />)
      
      const facebookButton = screen.getByLabelText('Bagikan ke Facebook')
      expect(facebookButton).toHaveClass('hover:bg-[#1877F2]')
      
      const twitterButton = screen.getByLabelText('Bagikan ke Twitter')
      expect(twitterButton).toHaveClass('hover:bg-[#1DA1F2]')
      
      const whatsappButton = screen.getByLabelText('Bagikan ke WhatsApp')
      expect(whatsappButton).toHaveClass('hover:bg-[#25D366]')
    })

    test('copy button changes color when copied', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined)
      
      render(<SocialShare {...defaultProps} />)
      
      const copyButton = screen.getByLabelText('Salin tautan')
      fireEvent.click(copyButton)
      
      await waitFor(() => {
        expect(copyButton).toHaveClass('bg-[hsl(var(--color-success))]')
        expect(copyButton).toHaveClass('text-white')
      })
    })

    test('copy button has hover color when not copied', () => {
      render(<SocialShare {...defaultProps} />)
      
      const copyButton = screen.getByLabelText('Salin tautan')
      expect(copyButton).toHaveClass('hover:bg-[hsl(var(--color-primary))]')
      expect(copyButton).toHaveClass('hover:text-white')
    })
  })

  describe('Memoization', () => {
    test('component is memoized', () => {
      expect(SocialShare.$$typeof?.toString()).toBe('Symbol(react.memo)')
    })
  })
})
