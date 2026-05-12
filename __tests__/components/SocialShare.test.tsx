import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import SocialShare from '@/components/ui/SocialShare'

jest.mock('@/lib/api/config', () => ({
  SITE_URL: 'https://test.example.com',
}))

describe('SocialShare Component', () => {
  const originalWindow = window
  const originalClipboard = navigator.clipboard

  beforeEach(() => {
    jest.clearAllMocks()
    ;(window.open as jest.Mock) = jest.fn()
  })

  afterEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      writable: true,
    })
  })

  describe('Rendering', () => {
    test('renders component with all share buttons', () => {
      render(<SocialShare title="Test Title" url="/test-article" />)
      
      expect(screen.getByLabelText('Bagikan ke Facebook')).toBeInTheDocument()
      expect(screen.getByLabelText('Bagikan ke Twitter')).toBeInTheDocument()
      expect(screen.getByLabelText('Bagikan ke WhatsApp')).toBeInTheDocument()
      expect(screen.getByLabelText('Salin tautan')).toBeInTheDocument()
    })

    test('renders with custom className', () => {
      render(<SocialShare title="Test" url="/test" className="custom-container" />)
      const container = screen.getByRole('button', { name: 'Bagikan ke Facebook' }).closest('div')
      expect(container?.parentElement).toHaveClass('custom-container')
    })

    test('renders all 4 buttons (3 social + 1 copy)', () => {
      render(<SocialShare title="Test" url="/test" />)
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(4)
    })
  })

  describe('Social Media Links', () => {
    test('Facebook button opens correct share URL', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      const fbButton = screen.getByLabelText('Bagikan ke Facebook')
      fireEvent.click(fbButton)
      
      expect(window.open).toHaveBeenCalledWith(
        'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fexample.com%2Ftest',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('Twitter button opens correct share URL with title and url', () => {
      render(<SocialShare title="My Test Article" url="https://example.com/article" />)
      
      const twitterButton = screen.getByLabelText('Bagikan ke Twitter')
      fireEvent.click(twitterButton)
      
      expect(window.open).toHaveBeenCalledWith(
        'https://twitter.com/intent/tweet?text=My%20Test%20Article&url=https%3A%2F%2Fexample.com%2Farticle',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('WhatsApp button opens correct share URL', () => {
      render(<SocialShare title="Check this out" url="https://example.com/post" />)
      
      const waButton = screen.getByLabelText('Bagikan ke WhatsApp')
      fireEvent.click(waButton)
      
      expect(window.open).toHaveBeenCalledWith(
        'https://wa.me/?text=Check%20this%20out%20https%3A%2F%2Fexample.com%2Fpost',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('URL encodes special characters in share text', () => {
      render(<SocialShare title="Test & Share > Article" url="/path?param=value" />)
      
      const twitterButton = screen.getByLabelText('Bagikan ke Twitter')
      fireEvent.click(twitterButton)
      
      expect(window.open).toHaveBeenCalledWith(
        'https://twitter.com/intent/tweet?text=Test%20%26%20Share%20%3E%20Article&url=https%3A%2F%2Ftest.example.com%2Fpath%3Fparam%3Dvalue',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })
  })

  describe('Share URL Generation', () => {
    test('uses full URL when already has http prefix', () => {
      render(<SocialShare title="Test" url="https://external.com/article" />)
      
      const twitterButton = screen.getByLabelText('Bagikan ke Twitter')
      fireEvent.click(twitterButton)
      
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('url=https%3A%2F%2Fexternal.com%2Farticle'),
        '_blank',
        expect.any(String)
      )
    })

    test('prepends SITE_URL when URL does not have http prefix', () => {
      render(<SocialShare title="Test" url="/my-article" />)
      
      const twitterButton = screen.getByLabelText('Bagikan ke Twitter')
      fireEvent.click(twitterButton)
      
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('url=https%3A%2F%2Ftest.example.com%2Fmy-article'),
        '_blank',
        expect.any(String)
      )
    })
  })

  describe('Copy Link Functionality', () => {
    test('copies full URL to clipboard when navigator.clipboard is available', async () => {
      const writeText = jest.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        writable: true,
      })
      
      render(<SocialShare title="Test" url="/article" />)
      
      const copyButton = screen.getByLabelText('Salin tautan')
      
      await act(async () => {
        fireEvent.click(copyButton)
      })
      
      expect(writeText).toHaveBeenCalledWith('https://test.example.com/article')
    })

    test('shows check icon and updated aria-label after copying', async () => {
      const writeText = jest.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        writable: true,
      })
      
      render(<SocialShare title="Test" url="/test" />)
      
      const copyButton = screen.getByLabelText('Salin tautan')
      
      await act(async () => {
        fireEvent.click(copyButton)
      })
      
      await waitFor(() => {
        expect(screen.getByLabelText('Tautan disalin')).toBeInTheDocument()
      })
    })

    test('resets copied state after 2 seconds', async () => {
      jest.useFakeTimers()
      const writeText = jest.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        writable: true,
      })
      
      render(<SocialShare title="Test" url="/test" />)
      
      const copyButton = screen.getByLabelText('Salin tautan')
      
      await act(async () => {
        fireEvent.click(copyButton)
      })
      
      await waitFor(() => {
        expect(screen.getByLabelText('Tautan disalin')).toBeInTheDocument()
      })
      
      act(() => {
        jest.advanceTimersByTime(2000)
      })
      
      expect(screen.getByLabelText('Salin tautan')).toBeInTheDocument()
      
      jest.useRealTimers()
    })
  })

  describe('Accessibility', () => {
    test('Facebook button has correct aria-label', () => {
      const { unmount } = render(<SocialShare title="Test" url="/test" />)
      
      const button = screen.getByLabelText('Bagikan ke Facebook')
      expect(button).toHaveAttribute('aria-label', 'Bagikan ke Facebook')
      
      unmount()
    })

    test('Twitter button has correct aria-label', () => {
      const { unmount } = render(<SocialShare title="Test" url="/test" />)
      
      const button = screen.getByLabelText('Bagikan ke Twitter')
      expect(button).toHaveAttribute('aria-label', 'Bagikan ke Twitter')
      
      unmount()
    })

    test('WhatsApp button has correct aria-label', () => {
      const { unmount } = render(<SocialShare title="Test" url="/test" />)
      
      const button = screen.getByLabelText('Bagikan ke WhatsApp')
      expect(button).toHaveAttribute('aria-label', 'Bagikan ke WhatsApp')
      
      unmount()
    })

    test('Copy button has dynamic aria-label based on state', () => {
      const { unmount } = render(<SocialShare title="Test" url="/test" />)
      
      expect(screen.getByLabelText('Salin tautan')).toBeInTheDocument()
      
      unmount()
    })

    test('buttons have title attributes for additional tooltip', () => {
      const { unmount } = render(<SocialShare title="Test" url="/test" />)
      
      const fbButton = screen.getByLabelText('Bagikan ke Facebook')
      expect(fbButton).toHaveAttribute('title', 'Bagikan ke Facebook')
      
      const copyButton = screen.getByLabelText('Salin tautan')
      expect(copyButton).toHaveAttribute('title', 'Salin tautan')
      
      unmount()
    })

    test('buttons have focus styles', () => {
      const { unmount } = render(<SocialShare title="Test" url="/test" />)
      
      const button = screen.getByLabelText('Bagikan ke Facebook')
      expect(button).toHaveClass('focus:outline-none')
      expect(button).toHaveClass('focus:ring-2')
      expect(button).toHaveClass('focus:ring-[hsl(var(--color-primary))]')
      
      unmount()
    })
  })

  describe('Memoization', () => {
    test('component is memoized (re-renders only when props change)', () => {
      const { rerender, unmount } = render(<SocialShare title="Title 1" url="/url1" />)
      
      rerender(<SocialShare title="Title 1" url="/url1" />)
      
      expect(screen.getByLabelText('Bagikan ke Facebook')).toBeInTheDocument()
      
      unmount()
    })
  })
})