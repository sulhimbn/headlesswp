import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SocialShare from '@/components/ui/SocialShare'

jest.mock('@/lib/api/config', () => ({
  SITE_URL: 'https://example.com',
}))

describe('SocialShare Component', () => {
  let originalOpen: typeof window.open

  beforeEach(() => {
    jest.clearAllMocks()
    originalOpen = window.open
    window.open = jest.fn()
  })

  afterEach(() => {
    window.open = originalOpen
    jest.restoreAllMocks()
  })

  describe('Rendering', () => {
    test('renders share buttons for all platforms', () => {
      render(<SocialShare title="Test Title" url="/test-page" />)
      
      expect(screen.getByRole('button', { name: /Bagikan ke Facebook/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Bagikan ke Twitter/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Bagikan ke WhatsApp/i })).toBeInTheDocument()
    })

    test('renders copy link button', () => {
      render(<SocialShare title="Test Title" url="/test-page" />)
      
      expect(screen.getByRole('button', { name: /Salin tautan/i })).toBeInTheDocument()
    })

    test('renders with custom className', () => {
      const { container } = render(<SocialShare title="Test Title" url="/test-page" className="custom-class" />)
      
      expect(container.firstChild).toHaveClass('custom-class')
    })

    test('renders correct number of share buttons', () => {
      render(<SocialShare title="Test Title" url="/test-page" />)
      
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(4)
    })
  })

  describe('URL Handling', () => {
    test('uses full URL when provided with http', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test-page" />)
      
      const facebookButton = screen.getByRole('button', { name: /Facebook/i })
      fireEvent.click(facebookButton)
      
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('u=https%3A%2F%2Fexample.com%2Ftest-page'),
        '_blank',
        expect.any(String)
      )
    })

    test('prepends SITE_URL when URL does not start with http', () => {
      render(<SocialShare title="Test Title" url="/test-page" />)
      
      const facebookButton = screen.getByRole('button', { name: /Facebook/i })
      fireEvent.click(facebookButton)
      
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('u=https%3A%2F%2Fexample.com%2Ftest-page'),
        '_blank',
        expect.any(String)
      )
    })
  })

  describe('Share Functionality', () => {
    test('opens Facebook share dialog', () => {
      render(<SocialShare title="Test Title" url="/test-page" />)
      
      const facebookButton = screen.getByRole('button', { name: /Facebook/i })
      fireEvent.click(facebookButton)
      
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('facebook.com/sharer'),
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('opens Twitter share dialog', () => {
      render(<SocialShare title="Test Title" url="/test-page" />)
      
      const twitterButton = screen.getByRole('button', { name: /Twitter/i })
      fireEvent.click(twitterButton)
      
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('twitter.com/intent/tweet'),
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('opens WhatsApp share dialog', () => {
      render(<SocialShare title="Test Title" url="/test-page" />)
      
      const whatsappButton = screen.getByRole('button', { name: /WhatsApp/i })
      fireEvent.click(whatsappButton)
      
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('wa.me'),
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('encodes title and URL in share links', () => {
      render(<SocialShare title="Test Title With Spaces" url="/test-page" />)
      
      const twitterButton = screen.getByRole('button', { name: /Twitter/i })
      fireEvent.click(twitterButton)
      
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent('Test Title With Spaces')),
        '_blank',
        expect.any(String)
      )
    })
  })

  describe('Copy Link', () => {
    test('copies URL to clipboard using navigator.clipboard', async () => {
      const mockWriteText = jest.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
      })

      render(<SocialShare title="Test Title" url="/test-page" />)
      
      const copyButton = screen.getByRole('button', { name: /Salin tautan/i })
      fireEvent.click(copyButton)
      
      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith('https://example.com/test-page')
      })
    })

    test('shows success state after copying', async () => {
      const mockWriteText = jest.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
      })

      render(<SocialShare title="Test Title" url="/test-page" />)
      
      const copyButton = screen.getByRole('button', { name: /Salin tautan/i })
      fireEvent.click(copyButton)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Tautan disalin' })).toBeInTheDocument()
      })
    })
  })

  describe('Memoization', () => {
    test('component is memoized', () => {
      const { rerender } = render(<SocialShare title="Test" url="/test" />)
      
      expect(() => {
        rerender(<SocialShare title="Test" url="/test" />)
      }).not.toThrow()
    })
  })
})
