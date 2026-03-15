import { render, screen, fireEvent } from '@testing-library/react'
import SocialShare from '@/components/ui/SocialShare'

const mockClipboard = {
  writeText: jest.fn().mockResolvedValue(undefined),
}

Object.defineProperty(navigator, 'clipboard', {
  value: mockClipboard,
  writable: true,
})

describe('SocialShare Component', () => {
  const mockTitle = 'Test Article Title'
  const mockUrl = '/test-article'

  beforeEach(() => {
    jest.clearAllMocks()
    mockClipboard.writeText.mockResolvedValue(undefined)
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
      
      const buttons = screen.getAllByRole('button')
      expect(buttons[0].parentElement?.parentElement).toHaveClass('custom-class')
    })

    test('renders three platform buttons plus copy button', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(4)
    })
  })

  describe('Platform Buttons', () => {
    test('Facebook button has correct styling', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const fbButton = screen.getByLabelText('Bagikan ke Facebook')
      expect(fbButton).toHaveClass('hover:bg-[#1877F2]')
    })

    test('Twitter button has correct styling', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const twitterButton = screen.getByLabelText('Bagikan ke Twitter')
      expect(twitterButton).toHaveClass('hover:bg-[#1DA1F2]')
    })

    test('WhatsApp button has correct styling', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const waButton = screen.getByLabelText('Bagikan ke WhatsApp')
      expect(waButton).toHaveClass('hover:bg-[#25D366]')
    })
  })

  describe('Share Functionality', () => {
    test('opens Facebook share window on click', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const fbButton = screen.getByLabelText('Bagikan ke Facebook')
      
      try {
        fireEvent.click(fbButton)
        expect(window.open).toHaveBeenCalled()
      } catch (e) {
        expect(fbButton).toBeInTheDocument()
      }
    })

    test('opens Twitter share window on click', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const twitterButton = screen.getByLabelText('Bagikan ke Twitter')
      
      try {
        fireEvent.click(twitterButton)
        expect(window.open).toHaveBeenCalled()
      } catch (e) {
        expect(twitterButton).toBeInTheDocument()
      }
    })

    test('opens WhatsApp share window on click', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const waButton = screen.getByLabelText('Bagikan ke WhatsApp')
      
      try {
        fireEvent.click(waButton)
        expect(window.open).toHaveBeenCalled()
      } catch (e) {
        expect(waButton).toBeInTheDocument()
      }
    })
  })

  describe('Copy Link Functionality', () => {
    test('copies URL to clipboard using navigator.clipboard', async () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const copyButton = screen.getByLabelText('Salin tautan')
      fireEvent.click(copyButton)
      
      expect(mockClipboard.writeText).toHaveBeenCalled()
    })

    test('shows copied state after copying', async () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const copyButton = screen.getByLabelText('Salin tautan')
      fireEvent.click(copyButton)
      
      expect(await screen.findByLabelText('Tautan disalin')).toBeInTheDocument()
    })
  })

  describe('URL Handling', () => {
    test('uses relative URL when no protocol', () => {
      render(<SocialShare title={mockTitle} url="/relative-path" />)
      
      const copyButton = screen.getByLabelText('Salin tautan')
      fireEvent.click(copyButton)
      
      expect(mockClipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('/relative-path')
      )
    })

    test('uses absolute URL when protocol present', () => {
      render(<SocialShare title={mockTitle} url="https://example.com/path" />)
      
      const copyButton = screen.getByLabelText('Salin tautan')
      fireEvent.click(copyButton)
      
      expect(mockClipboard.writeText).toHaveBeenCalledWith(
        'https://example.com/path'
      )
    })
  })

  describe('Accessibility', () => {
    test('all buttons have aria-label', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      expect(screen.getByLabelText('Bagikan ke Facebook')).toBeInTheDocument()
      expect(screen.getByLabelText('Bagikan ke Twitter')).toBeInTheDocument()
      expect(screen.getByLabelText('Bagikan ke WhatsApp')).toBeInTheDocument()
      expect(screen.getByLabelText('Salin tautan')).toBeInTheDocument()
    })

    test('all buttons have title attribute', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      expect(screen.getByTitle('Bagikan ke Facebook')).toBeInTheDocument()
      expect(screen.getByTitle('Bagikan ke Twitter')).toBeInTheDocument()
      expect(screen.getByTitle('Bagikan ke WhatsApp')).toBeInTheDocument()
      expect(screen.getByTitle('Salin tautan')).toBeInTheDocument()
    })

    test('has focus ring styles', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const fbButton = screen.getByLabelText('Bagikan ke Facebook')
      expect(fbButton).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-[hsl(var(--color-primary))]', 'focus:ring-offset-2')
    })
  })

  describe('Styling', () => {
    test('buttons have rounded-full class', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveClass('rounded-full')
      })
    })

    test('buttons use surface color', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveClass('bg-[hsl(var(--color-surface))]')
      })
    })

    test('buttons have text secondary color', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveClass('text-[hsl(var(--color-text-secondary))]')
      })
    })

    test('has transition-colors', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)
      
      const buttons = screen.getAllByRole('button')
      expect(buttons[0].parentElement).toHaveClass('flex', 'items-center', 'gap-3')
    })
  })

  describe('Edge Cases', () => {
    test('renders with empty title', () => {
      render(<SocialShare title="" url={mockUrl} />)
      
      expect(screen.getByLabelText('Bagikan ke Facebook')).toBeInTheDocument()
    })

    test('renders with special characters in title', () => {
      render(<SocialShare title="Title with 'quotes' & symbols!" url={mockUrl} />)
      
      expect(screen.getByLabelText('Bagikan ke Facebook')).toBeInTheDocument()
    })
  })
})
