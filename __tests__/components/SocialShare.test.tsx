import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SocialShare from '@/components/ui/SocialShare'

const mockOpen = jest.fn()
const mockWriteText = jest.fn()
const mockExecCommand = jest.fn()

beforeAll(() => {
  window.open = mockOpen
  Object.defineProperty(navigator, 'clipboard', {
    writable: true,
    value: {
      writeText: mockWriteText,
    },
  })
  document.execCommand = mockExecCommand
})

beforeEach(() => {
  jest.clearAllMocks()
  mockOpen.mockReturnValue(null)
  mockWriteText.mockResolvedValue(undefined)
  mockExecCommand.mockReturnValue(true)
})

describe('SocialShare Component', () => {
  const defaultProps = {
    title: 'Test Article',
    url: '/test-article',
  }

  describe('Rendering', () => {
    test('renders all share buttons', () => {
      render(<SocialShare {...defaultProps} />)
      
      expect(screen.getByLabelText('Bagikan ke Facebook')).toBeInTheDocument()
      expect(screen.getByLabelText('Bagikan ke Twitter')).toBeInTheDocument()
      expect(screen.getByLabelText('Bagikan ke WhatsApp')).toBeInTheDocument()
      expect(screen.getByLabelText('Salin tautan')).toBeInTheDocument()
    })

    test('renders with custom className', () => {
      render(<SocialShare {...defaultProps} className="custom-class" />)
      const container = document.querySelector('.custom-class')
      expect(container).toBeInTheDocument()
    })

    test('renders all four platform buttons', () => {
      render(<SocialShare {...defaultProps} />)
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(4)
    })
  })

  describe('Share Button Clicks', () => {
    test('Facebook button opens correct URL', () => {
      render(<SocialShare {...defaultProps} />)
      
      const facebookButton = screen.getByLabelText('Bagikan ke Facebook')
      fireEvent.click(facebookButton)
      
      expect(mockOpen).toHaveBeenCalledWith(
        'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fmitrabantennews.com%2Ftest-article',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('Twitter button opens correct URL', () => {
      render(<SocialShare {...defaultProps} />)
      
      const twitterButton = screen.getByLabelText('Bagikan ke Twitter')
      fireEvent.click(twitterButton)
      
      expect(mockOpen).toHaveBeenCalledWith(
        'https://twitter.com/intent/tweet?text=Test%20Article&url=https%3A%2F%2Fmitrabantennews.com%2Ftest-article',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('WhatsApp button opens correct URL', () => {
      render(<SocialShare {...defaultProps} />)
      
      const whatsappButton = screen.getByLabelText('Bagikan ke WhatsApp')
      fireEvent.click(whatsappButton)
      
      expect(mockOpen).toHaveBeenCalledWith(
        'https://wa.me/?text=Test%20Article%20https%3A%2F%2Fmitrabantennews.com%2Ftest-article',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('uses full URL when URL starts with http', () => {
      render(<SocialShare title="Test" url="https://example.com/article" />)
      
      const facebookButton = screen.getByLabelText('Bagikan ke Facebook')
      fireEvent.click(facebookButton)
      
      expect(mockOpen).toHaveBeenCalledWith(
        'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fexample.com%2Farticle',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('encodes special characters in title and URL', () => {
      render(<SocialShare title="Test & News <2024>" url="/test-article" />)
      
      const twitterButton = screen.getByLabelText('Bagikan ke Twitter')
      fireEvent.click(twitterButton)
      
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('Test%20%26%20News%20%3C2024%3E'),
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })
  })

  describe('Copy Link Functionality', () => {
    test('copies URL using Clipboard API', async () => {
      render(<SocialShare {...defaultProps} />)
      
      const copyButton = screen.getByLabelText('Salin tautan')
      fireEvent.click(copyButton)
      
      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith('https://mitrabantennews.com/test-article')
      })
    })

    test('shows checkmark icon after successful copy', async () => {
      render(<SocialShare {...defaultProps} />)
      
      const copyButton = screen.getByLabelText('Salin tautan')
      fireEvent.click(copyButton)
      
      await waitFor(() => {
        expect(screen.getByLabelText('Tautan disalin')).toBeInTheDocument()
      })
    })

    test('changes button background to success color after copy', async () => {
      render(<SocialShare {...defaultProps} />)
      
      const copyButton = screen.getByLabelText('Salin tautan')
      fireEvent.click(copyButton)
      
      await waitFor(() => {
        expect(copyButton).toHaveClass('bg-[hsl(var(--color-success))]')
        expect(copyButton).toHaveClass('text-white')
      })
    })

    test('resets copy state after 2 seconds', async () => {
      jest.useFakeTimers()
      
      render(<SocialShare {...defaultProps} />)
      
      const copyButton = screen.getByLabelText('Salin tautan')
      fireEvent.click(copyButton)
      
      await waitFor(() => {
        expect(screen.getByLabelText('Tautan disalin')).toBeInTheDocument()
      })
      
      jest.advanceTimersByTime(2000)
      
      await waitFor(() => {
        expect(screen.getByLabelText('Salin tautan')).toBeInTheDocument()
      })
      
      jest.useRealTimers()
    })
  })

  describe('Fallback Copy Method', () => {
    test('uses fallback when clipboard API throws error', async () => {
      mockWriteText.mockRejectedValue(new Error('Clipboard API not available'))
      
      render(<SocialShare {...defaultProps} />)
      
      const copyButton = screen.getByLabelText('Salin tautan')
      fireEvent.click(copyButton)
      
      await waitFor(() => {
        expect(mockExecCommand).toHaveBeenCalledWith('copy')
      })
      
      expect(screen.getByLabelText('Tautan disalin')).toBeInTheDocument()
    })

    test('creates temporary input element for fallback copy', async () => {
      mockWriteText.mockRejectedValue(new Error('Clipboard API not available'))
      
      const appendChildSpy = jest.spyOn(document.body, 'appendChild')
      const removeChildSpy = jest.spyOn(document.body, 'removeChild')
      
      render(<SocialShare {...defaultProps} />)
      
      const copyButton = screen.getByLabelText('Salin tautan')
      fireEvent.click(copyButton)
      
      await waitFor(() => {
        expect(appendChildSpy).toHaveBeenCalled()
        expect(removeChildSpy).toHaveBeenCalled()
      })
      
      appendChildSpy.mockRestore()
      removeChildSpy.mockRestore()
    })

    test('fallback copies correct URL to input value', async () => {
      mockWriteText.mockRejectedValueOnce(new Error('Clipboard API not available'))
      
      render(<SocialShare {...defaultProps} />)
      
      const copyButton = screen.getByLabelText('Salin tautan')
      fireEvent.click(copyButton)
      
      await waitFor(() => {
        expect(mockExecCommand).toHaveBeenCalledWith('copy')
      })
    })
  })

  describe('Platform URL Generation', () => {
    test('generates correct Facebook share URL', () => {
      const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://mitrabantennews.com/test')}`
      expect(url).toBe('https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fmitrabantennews.com%2Ftest')
    })

    test('generates correct Twitter share URL', () => {
      const title = 'Test Title'
      const url = 'https://mitrabantennews.com/test'
      const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
      expect(shareUrl).toContain(encodeURIComponent(title))
      expect(shareUrl).toContain(encodeURIComponent(url))
    })

    test('generates correct WhatsApp share URL', () => {
      const title = 'Test Title'
      const url = 'https://mitrabantennews.com/test'
      const shareUrl = `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`
      expect(shareUrl).toContain(encodeURIComponent(title + ' ' + url))
    })
  })

  describe('Accessibility', () => {
    test('all buttons have aria-label', () => {
      render(<SocialShare {...defaultProps} />)
      
      expect(screen.getByLabelText('Bagikan ke Facebook')).toBeInTheDocument()
      expect(screen.getByLabelText('Bagikan ke Twitter')).toBeInTheDocument()
      expect(screen.getByLabelText('Bagikan ke WhatsApp')).toBeInTheDocument()
      expect(screen.getByLabelText('Salin tautan')).toBeInTheDocument()
    })

    test('all buttons have title attribute', () => {
      render(<SocialShare {...defaultProps} />)
      
      expect(screen.getByTitle('Bagikan ke Facebook')).toBeInTheDocument()
      expect(screen.getByTitle('Bagikan ke Twitter')).toBeInTheDocument()
      expect(screen.getByTitle('Bagikan ke WhatsApp')).toBeInTheDocument()
      expect(screen.getByTitle('Salin tautan')).toBeInTheDocument()
    })

    test('copy button has dynamic aria-label when copied', async () => {
      render(<SocialShare {...defaultProps} />)
      
      const copyButton = screen.getByLabelText('Salin tautan')
      fireEvent.click(copyButton)
      
      await waitFor(() => {
        expect(screen.getByLabelText('Tautan disalin')).toBeInTheDocument()
      })
    })

    test('buttons are focusable', () => {
      render(<SocialShare {...defaultProps} />)
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('tabindex', '-1')
      })
    })
  })

  describe('Edge Cases', () => {
    test('handles URL with query parameters', () => {
      render(<SocialShare title="Test" url="/article?id=123&category=news" />)
      
      const facebookButton = screen.getByLabelText('Bagikan ke Facebook')
      fireEvent.click(facebookButton)
      
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('category%3Dnews'),
        '_blank',
        expect.any(String)
      )
    })

    test('handles URL with hash fragment', () => {
      render(<SocialShare title="Test" url="/article#section" />)
      
      const whatsappButton = screen.getByLabelText('Bagikan ke WhatsApp')
      fireEvent.click(whatsappButton)
      
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('%23section'),
        '_blank',
        expect.any(String)
      )
    })

    test('handles empty title', () => {
      render(<SocialShare title="" url="/test" />)
      
      const twitterButton = screen.getByLabelText('Bagikan ke Twitter')
      fireEvent.click(twitterButton)
      
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('text='),
        '_blank',
        expect.any(String)
      )
    })

    test('handles very long title', () => {
      const longTitle = 'A'.repeat(500)
      render(<SocialShare title={longTitle} url="/test" />)
      
      const twitterButton = screen.getByLabelText('Bagikan ke Twitter')
      fireEvent.click(twitterButton)
      
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent(longTitle)),
        '_blank',
        expect.any(String)
      )
    })
  })
})
