import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import SocialShare from '@/components/ui/SocialShare'

const originalOpen = window.open
const originalClipboard = navigator.clipboard

beforeAll(() => {
  jest.useFakeTimers()
})

afterAll(() => {
  jest.useRealTimers()
})

beforeEach(() => {
  window.open = jest.fn()
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: jest.fn().mockResolvedValue(undefined),
    },
    writable: true,
  })
})

afterEach(() => {
  window.open = originalOpen
  Object.defineProperty(navigator, 'clipboard', {
    value: originalClipboard,
    writable: true,
  })
})

describe('SocialShare Component', () => {
  describe('Rendering', () => {
    test('renders social share buttons', () => {
      render(<SocialShare title="Test Title" url="/test-url" />)
      
      expect(screen.getByLabelText(/Facebook/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Twitter/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/WhatsApp/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Salin tautan/i)).toBeInTheDocument()
    })

    test('renders with custom className', () => {
      render(<SocialShare title="Test Title" url="/test" className="custom-class" />)
      
      const container = screen.getByRole('group')
      expect(container).toHaveClass('custom-class')
    })

    test('renders all platform buttons', () => {
      render(<SocialShare title="Test" url="/url" />)
      
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(4)
    })
  })

  describe('Functionality', () => {
    test('opens Facebook share window on click', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      const facebookButton = screen.getByLabelText(/Facebook/i)
      fireEvent.click(facebookButton)
      
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('facebook.com/sharer'),
        '_blank',
        expect.any(String)
      )
    })

    test('opens Twitter share window on click', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      const twitterButton = screen.getByLabelText(/Twitter/i)
      fireEvent.click(twitterButton)
      
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('twitter.com/intent/tweet'),
        '_blank',
        expect.any(String)
      )
    })

    test('opens WhatsApp share window on click', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      const whatsappButton = screen.getByLabelText(/WhatsApp/i)
      fireEvent.click(whatsappButton)
      
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('wa.me'),
        '_blank',
        expect.any(String)
      )
    })

    test('copies URL to clipboard on copy button click', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      const copyButton = screen.getByLabelText(/Salin tautan/i)
      fireEvent.click(copyButton)
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://example.com/test')
    })

    test('shows check icon after copying', async () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      const copyButton = screen.getByLabelText(/Salin tautan/i)
      
      await act(async () => {
        fireEvent.click(copyButton)
      })
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Tautan disalin/i)).toBeInTheDocument()
      })
    })
  })

  describe('URL Handling', () => {
    test('prepends SITE_URL for relative URLs', () => {
      render(<SocialShare title="Test" url="/relative-path" />)
      
      const copyButton = screen.getByLabelText(/Salin tautan/i)
      fireEvent.click(copyButton)
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('/relative-path')
      )
    })

    test('uses absolute URL as-is', () => {
      render(<SocialShare title="Test" url="https://other.com/page" />)
      
      const copyButton = screen.getByLabelText(/Salin tautan/i)
      fireEvent.click(copyButton)
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://other.com/page')
    })
  })

  describe('Accessibility', () => {
    test('has proper role group', () => {
      render(<SocialShare title="Test" url="/url" />)
      
      expect(screen.getByRole('group')).toHaveAttribute('aria-label', 'Bagikan ke media sosial')
    })

    test('buttons have proper accessibility attributes', () => {
      render(<SocialShare title="Test" url="/url" />)
      
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(4)
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label')
      })
    })

    test('copy button has dynamic aria-label when copied', async () => {
      render(<SocialShare title="Test" url="/url" />)
      
      const copyButton = screen.getByLabelText(/Salin tautan/i)
      
      await act(async () => {
        fireEvent.click(copyButton)
      })
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Tautan disalin/i)).toBeInTheDocument()
      })
    })
  })

  describe('Keyboard Navigation', () => {
    test('triggers share on Enter key', () => {
      render(<SocialShare title="Test" url="https://example.com/test" />)
      
      const facebookButton = screen.getByLabelText(/Facebook/i)
      fireEvent.keyDown(facebookButton, { key: 'Enter' })
      
      expect(window.open).toHaveBeenCalled()
    })

    test('triggers share on Space key', () => {
      render(<SocialShare title="Test" url="https://example.com/test" />)
      
      const twitterButton = screen.getByLabelText(/Twitter/i)
      fireEvent.keyDown(twitterButton, { key: ' ' })
      
      expect(window.open).toHaveBeenCalled()
    })

    test('triggers copy on Enter key', () => {
      render(<SocialShare title="Test" url="/url" />)
      
      const copyButton = screen.getByLabelText(/Salin tautan/i)
      fireEvent.keyDown(copyButton, { key: 'Enter' })
      
      expect(navigator.clipboard.writeText).toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    test('handles empty title', () => {
      render(<SocialShare title="" url="/url" />)
      
      expect(screen.getByLabelText(/Facebook/i)).toHaveAttribute('aria-label', expect.stringContaining(''))
    })

    test('renders with default className', () => {
      render(<SocialShare title="Test" url="/url" />)
      
      const container = screen.getByRole('group')
      expect(container.className).toBe('')
    })
  })
})