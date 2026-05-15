import { render, screen, fireEvent } from '@testing-library/react'
import SocialShare from '@/components/ui/SocialShare'

const mockWindowOpen = jest.fn()
global.window.open = mockWindowOpen
Object.defineProperty(global.navigator, 'clipboard', {
  value: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
  writable: true,
})

jest.mock('@/lib/api/config', () => ({
  SITE_URL: 'https://example.com',
}))

describe('SocialShare Component', () => {
  beforeEach(() => {
    mockWindowOpen.mockClear()
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    test('renders all share platforms', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)

      expect(screen.getByLabelText(/Bagikan ke Facebook/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Bagikan ke Twitter/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Bagikan ke WhatsApp/i)).toBeInTheDocument()
    })

    test('renders copy link button', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)

      expect(screen.getByLabelText(/Salin tautan/i)).toBeInTheDocument()
    })

    test('renders with custom className', () => {
      render(
        <SocialShare title="Test Title" url="https://example.com/test" className="custom-class" />
      )
      const container = document.querySelector('.custom-class')
      expect(container).toBeInTheDocument()
    })

    test('renders 4 share buttons (3 platforms + copy link)', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(4)
    })
  })

  describe('Share URL Generation', () => {
    test('generates correct Facebook share URL', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)

      const facebookButton = screen.getByLabelText(/Bagikan ke Facebook/i)
      fireEvent.click(facebookButton)

      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fexample.com%2Ftest',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('generates correct Twitter share URL', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)

      const twitterButton = screen.getByLabelText(/Bagikan ke Twitter/i)
      fireEvent.click(twitterButton)

      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://twitter.com/intent/tweet?text=Test%20Title&url=https%3A%2F%2Fexample.com%2Ftest',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('generates correct WhatsApp share URL', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)

      const whatsappButton = screen.getByLabelText(/Bagikan ke WhatsApp/i)
      fireEvent.click(whatsappButton)

      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://wa.me/?text=Test%20Title%20https%3A%2F%2Fexample.com%2Ftest',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('prepends SITE_URL when URL does not start with http', () => {
      render(<SocialShare title="Test Title" url="/blog/post-1" />)

      const facebookButton = screen.getByLabelText(/Bagikan ke Facebook/i)
      fireEvent.click(facebookButton)

      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fexample.com%2Fblog%2Fpost-1',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })
  })

  describe('Click Handlers', () => {
    test('calls window.open with correct parameters for Facebook', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)

      const facebookButton = screen.getByLabelText(/Bagikan ke Facebook/i)
      fireEvent.click(facebookButton)

      expect(mockWindowOpen).toHaveBeenCalledTimes(1)
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('facebook.com'),
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('calls window.open with correct parameters for Twitter', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)

      const twitterButton = screen.getByLabelText(/Bagikan ke Twitter/i)
      fireEvent.click(twitterButton)

      expect(mockWindowOpen).toHaveBeenCalledTimes(1)
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('twitter.com'),
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('calls window.open with correct parameters for WhatsApp', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)

      const whatsappButton = screen.getByLabelText(/Bagikan ke WhatsApp/i)
      fireEvent.click(whatsappButton)

      expect(mockWindowOpen).toHaveBeenCalledTimes(1)
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('wa.me'),
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('copies URL to clipboard when copy button is clicked', async () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)

      const copyButton = screen.getByLabelText(/Salin tautan/i)
      fireEvent.click(copyButton)

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'https://example.com/test'
      )
    })

    test('updates aria-label to "Tautan disalin" after copying', async () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)

      const copyButton = screen.getByLabelText(/Salin tautan/i)
      fireEvent.click(copyButton)

      await screen.findByLabelText(/Tautan disalin/)
      expect(screen.getByLabelText(/Tautan disalin/)).toBeInTheDocument()
    })

    test('resets copy button state after 2 seconds', async () => {
      jest.useFakeTimers()
      render(<SocialShare title="Test Title" url="https://example.com/test" />)

      const copyButton = screen.getByLabelText(/Salin tautan/i)
      fireEvent.click(copyButton)

      await screen.findByLabelText(/Tautan disalin/)

      jest.advanceTimersByTime(2000)

      await screen.findByLabelText(/Salin tautan/)

      jest.useRealTimers()
    })
  })

  describe('Accessibility', () => {
    test('has correct aria-label for Facebook button', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)

      const facebookButton = screen.getByLabelText(/Bagikan ke Facebook/i)
      expect(facebookButton).toHaveAttribute('aria-label', 'Bagikan ke Facebook')
    })

    test('has correct aria-label for Twitter button', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)

      const twitterButton = screen.getByLabelText(/Bagikan ke Twitter/i)
      expect(twitterButton).toHaveAttribute('aria-label', 'Bagikan ke Twitter')
    })

    test('has correct aria-label for WhatsApp button', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)

      const whatsappButton = screen.getByLabelText(/Bagikan ke WhatsApp/i)
      expect(whatsappButton).toHaveAttribute('aria-label', 'Bagikan ke WhatsApp')
    })

    test('has correct aria-label for copy button', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)

      const copyButton = screen.getByLabelText(/Salin tautan/i)
      expect(copyButton).toHaveAttribute('aria-label', 'Salin tautan')
    })

    test('has title attribute for each button', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)

      expect(screen.getByTitle('Bagikan ke Facebook')).toBeInTheDocument()
      expect(screen.getByTitle('Bagikan ke Twitter')).toBeInTheDocument()
      expect(screen.getByTitle('Bagikan ke WhatsApp')).toBeInTheDocument()
      expect(screen.getByTitle('Salin tautan')).toBeInTheDocument()
    })

    test('has focus styles on buttons', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveClass('focus:outline-none')
        expect(button).toHaveClass('focus:ring-2')
        expect(button).toHaveClass('focus:ring-[hsl(var(--color-primary))]')
        expect(button).toHaveClass('focus:ring-offset-2')
      })
    })

    test('buttons are focusable', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('disabled')
      })
    })
  })
})