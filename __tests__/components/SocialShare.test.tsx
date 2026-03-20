import { render, screen, fireEvent } from '@testing-library/react'
import SocialShare from '@/components/ui/SocialShare'

const originalClipboard = { ...navigator.clipboard }

const mockOpen = jest.fn()

Object.defineProperty(window, 'open', {
  value: mockOpen,
  writable: true,
})

describe('SocialShare Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockOpen.mockClear()
    
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
      writable: true,
    })
  })

  afterAll(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      writable: true,
    })
  })

  describe('Rendering', () => {
    test('renders all social platform buttons', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      expect(screen.getByRole('button', { name: /Facebook/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Twitter/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /WhatsApp/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Salin tautan/i })).toBeInTheDocument()
    })

    test('renders with custom className', () => {
      const { container } = render(
        <SocialShare title="Test Title" url="https://example.com/test" className="custom-class" />
      )
      expect(container.firstChild).toHaveClass('custom-class')
    })

    test('renders all buttons in a flex container', () => {
      const { container } = render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const flexContainer = container.querySelector('.flex')
      expect(flexContainer).toBeInTheDocument()
    })
  })

  describe('Share Functionality', () => {
    test('opens Facebook share dialog', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const facebookButton = screen.getByRole('button', { name: /Facebook/i })
      fireEvent.click(facebookButton)
      
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('facebook.com/sharer/sharer.php'),
        '_blank',
        expect.any(String)
      )
    })

    test('opens Twitter share dialog', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const twitterButton = screen.getByRole('button', { name: /Twitter/i })
      fireEvent.click(twitterButton)
      
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('twitter.com/intent/tweet'),
        '_blank',
        expect.any(String)
      )
    })

    test('opens WhatsApp share dialog', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const whatsappButton = screen.getByRole('button', { name: /WhatsApp/i })
      fireEvent.click(whatsappButton)
      
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('wa.me'),
        '_blank',
        expect.any(String)
      )
    })

    test('copies link to clipboard', async () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const copyButton = screen.getByRole('button', { name: /Salin tautan/i })
      fireEvent.click(copyButton)
      
      await Promise.resolve()
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://example.com/test')
    })
  })

  describe('Accessibility', () => {
    test('buttons have aria-labels', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      expect(screen.getByLabelText(/Bagikan ke Facebook/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Bagikan ke Twitter/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Bagikan ke WhatsApp/i)).toBeInTheDocument()
    })

    test('buttons have titles', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      const facebookButton = screen.getByRole('button', { name: /Facebook/i })
      expect(facebookButton).toHaveAttribute('title', 'Bagikan ke Facebook')
    })

    test('buttons are focusable', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const facebookButton = screen.getByRole('button', { name: /Facebook/i })
      
      facebookButton.focus()
      expect(facebookButton).toHaveFocus()
    })

    test('has focus ring styles', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const facebookButton = screen.getByRole('button', { name: /Facebook/i })
      
      expect(facebookButton).toHaveClass('focus:outline-none')
      expect(facebookButton).toHaveClass('focus:ring-2')
    })
  })

  describe('Design Tokens', () => {
    test('buttons have surface background color', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const facebookButton = screen.getByRole('button', { name: /Facebook/i })
      
      expect(facebookButton).toHaveClass('bg-[hsl(var(--color-surface))]')
    })

    test('buttons have secondary text color', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const facebookButton = screen.getByRole('button', { name: /Facebook/i })
      
      expect(facebookButton).toHaveClass('text-[hsl(var(--color-text-secondary))]')
    })

    test('buttons have rounded corners', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const facebookButton = screen.getByRole('button', { name: /Facebook/i })
      
      expect(facebookButton).toHaveClass('rounded-full')
    })

    test('buttons have hover transitions', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const facebookButton = screen.getByRole('button', { name: /Facebook/i })
      
      expect(facebookButton).toHaveClass('transition-colors')
    })

    test('Facebook button has Facebook hover color', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const facebookButton = screen.getByRole('button', { name: /Facebook/i })
      
      expect(facebookButton).toHaveClass('hover:bg-[#1877F2]')
    })

    test('Twitter button has Twitter hover color', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const twitterButton = screen.getByRole('button', { name: /Twitter/i })
      
      expect(twitterButton).toHaveClass('hover:bg-[#1DA1F2]')
    })

    test('WhatsApp button has WhatsApp hover color', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const whatsappButton = screen.getByRole('button', { name: /WhatsApp/i })
      
      expect(whatsappButton).toHaveClass('hover:bg-[#25D366]')
    })
  })

  describe('Spacing', () => {
    test('buttons are spaced with gap', () => {
      const { container } = render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const flexContainer = container.querySelector('.flex')
      
      expect(flexContainer).toHaveClass('gap-3')
    })
  })

  describe('Icon Rendering', () => {
    test('renders SVG icons for each platform', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      const svgIcons = document.querySelectorAll('svg')
      expect(svgIcons.length).toBeGreaterThanOrEqual(4)
    })

    test('icons have aria-hidden attribute', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      const svgIcons = document.querySelectorAll('svg')
      svgIcons.forEach(svg => {
        expect(svg).toHaveAttribute('aria-hidden', 'true')
      })
    })

    test('icons have proper size classes', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      const svgIcons = document.querySelectorAll('svg')
      svgIcons.forEach(svg => {
        expect(svg).toHaveClass('w-5', 'h-5')
      })
    })
  })

  describe('URL Handling', () => {
    test('uses full URL when http is provided', () => {
      render(<SocialShare title="Test" url="https://example.com/page" />)
      const copyButton = screen.getByRole('button', { name: /Salin tautan/i })
      fireEvent.click(copyButton)
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://example.com/page')
    })
  })

  describe('Edge Cases', () => {
    test('handles empty title', () => {
      render(<SocialShare title="" url="https://example.com/test" />)
      expect(screen.getByRole('button', { name: /Facebook/i })).toBeInTheDocument()
    })
  })
})
