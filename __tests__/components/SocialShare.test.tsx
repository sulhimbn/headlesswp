import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import SocialShare from '@/components/ui/SocialShare'

jest.mock('@/lib/api/config', () => ({
  SITE_URL: 'https://example.com',
}))

const mockOpen = jest.fn()
window.open = mockOpen

describe('SocialShare Component', () => {
  let spies: jest.SpyInstance[] = []

  beforeEach(() => {
    jest.clearAllMocks()
    mockOpen.mockReset()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
    spies.forEach(spy => spy.mockRestore())
    spies = []
  })

  describe('Share button clicks', () => {
    test('renders Facebook share button', () => {
      const { unmount } = render(<SocialShare title="Test Title" url="/test-url" />)
      expect(screen.getByLabelText('Bagikan ke Facebook')).toBeInTheDocument()
      unmount()
    })

    test('renders Twitter share button', () => {
      const { unmount } = render(<SocialShare title="Test Title" url="/test-url" />)
      expect(screen.getByLabelText('Bagikan ke Twitter')).toBeInTheDocument()
      unmount()
    })

    test('renders WhatsApp share button', () => {
      const { unmount } = render(<SocialShare title="Test Title" url="/test-url" />)
      expect(screen.getByLabelText('Bagikan ke WhatsApp')).toBeInTheDocument()
      unmount()
    })

    test('opens Facebook share URL', () => {
      const { unmount } = render(<SocialShare title="Test Title" url="/test-url" />)
      const facebookButton = screen.getByLabelText('Bagikan ke Facebook')
      fireEvent.click(facebookButton)

      expect(mockOpen).toHaveBeenCalledWith(
        'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fexample.com%2Ftest-url',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
      unmount()
    })

    test('opens Twitter share URL with title', () => {
      const { unmount } = render(<SocialShare title="Test Title" url="/test-url" />)
      const twitterButton = screen.getByLabelText('Bagikan ke Twitter')
      fireEvent.click(twitterButton)

      expect(mockOpen).toHaveBeenCalledWith(
        'https://twitter.com/intent/tweet?text=Test%20Title&url=https%3A%2F%2Fexample.com%2Ftest-url',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
      unmount()
    })

    test('opens WhatsApp share URL', () => {
      const { unmount } = render(<SocialShare title="Test Title" url="/test-url" />)
      const whatsappButton = screen.getByLabelText('Bagikan ke WhatsApp')
      fireEvent.click(whatsappButton)

      expect(mockOpen).toHaveBeenCalledWith(
        'https://wa.me/?text=Test%20Title%20https%3A%2F%2Fexample.com%2Ftest-url',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
      unmount()
    })

    test('handles full URL input', () => {
      const { unmount } = render(<SocialShare title="Test Title" url="https://other.com/page" />)
      const facebookButton = screen.getByLabelText('Bagikan ke Facebook')
      fireEvent.click(facebookButton)

      expect(mockOpen).toHaveBeenCalledWith(
        'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fother.com%2Fpage',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
      unmount()
    })
  })

  describe('Copy link functionality', () => {
    test('renders copy link button', () => {
      const { unmount } = render(<SocialShare title="Test Title" url="/test-url" />)
      expect(screen.getByLabelText('Salin tautan')).toBeInTheDocument()
      unmount()
    })

    test('copies link using clipboard API when available', async () => {
      const clipboardMock = {
        writeText: jest.fn().mockResolvedValue(undefined),
      }
      Object.defineProperty(navigator, 'clipboard', {
        value: clipboardMock,
        configurable: true,
      })

      const { unmount } = render(<SocialShare title="Test Title" url="/test-url" />)
      const copyButton = screen.getByLabelText('Salin tautan')
      
      await act(async () => {
        fireEvent.click(copyButton)
      })

      expect(clipboardMock.writeText).toHaveBeenCalledWith('https://example.com/test-url')
      unmount()
    })

    test('shows copied state after successful copy', async () => {
      const clipboardMock = {
        writeText: jest.fn().mockResolvedValue(undefined),
      }
      Object.defineProperty(navigator, 'clipboard', {
        value: clipboardMock,
        configurable: true,
      })

      const { unmount } = render(<SocialShare title="Test Title" url="/test-url" />)
      const copyButton = screen.getByLabelText('Salin tautan')
      
      await act(async () => {
        fireEvent.click(copyButton)
      })

      await waitFor(() => {
        expect(screen.getByLabelText('Tautan disalin')).toBeInTheDocument()
      })
      unmount()
    })
  })

  describe('Memoization', () => {
    test('component is memoized', () => {
      const { rerender, unmount } = render(<SocialShare title="Test" url="/test" />)
      expect(screen.getByLabelText('Bagikan ke Facebook')).toBeInTheDocument()
      
      rerender(<SocialShare title="Test" url="/test" />)
      expect(screen.getByLabelText('Bagikan ke Facebook')).toBeInTheDocument()
      unmount()
    })
  })

  describe('Custom className', () => {
    test('applies custom className to container', () => {
      const { container, unmount } = render(<SocialShare title="Test" url="/test" className="custom-class" />)
      expect(container.firstChild).toHaveClass('custom-class')
      unmount()
    })
  })
})
