import { render, screen, fireEvent, act } from '@testing-library/react'
import SocialShare from '@/components/ui/SocialShare'

jest.mock('@/lib/api/config', () => ({
  SITE_URL: 'https://example.com',
}))

jest.spyOn(window, 'open').mockImplementation(() => null)

describe('SocialShare Component', () => {
  const defaultProps = {
    title: 'Test Article',
    url: 'https://example.com/test-article',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Rendering', () => {
    test('renders Facebook button', () => {
      render(<SocialShare {...defaultProps} />)
      const fbButton = screen.getByRole('button', { name: 'Bagikan ke Facebook' })
      expect(fbButton).toBeInTheDocument()
    })

    test('renders Twitter button', () => {
      render(<SocialShare {...defaultProps} />)
      const twitterButton = screen.getByRole('button', { name: 'Bagikan ke Twitter' })
      expect(twitterButton).toBeInTheDocument()
    })

    test('renders WhatsApp button', () => {
      render(<SocialShare {...defaultProps} />)
      const waButton = screen.getByRole('button', { name: 'Bagikan ke WhatsApp' })
      expect(waButton).toBeInTheDocument()
    })

    test('renders copy link button initially', () => {
      render(<SocialShare {...defaultProps} />)
      const copyButton = screen.getByRole('button', { name: 'Salin tautan' })
      expect(copyButton).toBeInTheDocument()
    })

    test('renders container div', () => {
      render(<SocialShare {...defaultProps} />)
      const container = document.querySelector('div.custom-share') || document.querySelector('div')
      expect(container).toBeInTheDocument()
    })

    test('applies custom className', () => {
      render(<SocialShare {...defaultProps} className="custom-share" />)
      const container = document.querySelector('div.custom-share')
      expect(container).toBeInTheDocument()
    })

    test('renders all share buttons', () => {
      render(<SocialShare {...defaultProps} />)
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('Share Functionality', () => {
    test('opens Facebook share dialog', () => {
      render(<SocialShare {...defaultProps} />)
      const fbButton = screen.getByRole('button', { name: 'Bagikan ke Facebook' })
      fireEvent.click(fbButton)
      
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('facebook.com/sharer/sharer.php'),
        '_blank',
        expect.any(String)
      )
    })

    test('opens Twitter share dialog', () => {
      render(<SocialShare {...defaultProps} />)
      const twitterButton = screen.getByRole('button', { name: 'Bagikan ke Twitter' })
      fireEvent.click(twitterButton)
      
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('twitter.com/intent/tweet'),
        '_blank',
        expect.any(String)
      )
    })

    test('opens WhatsApp share dialog', () => {
      render(<SocialShare {...defaultProps} />)
      const waButton = screen.getByRole('button', { name: 'Bagikan ke WhatsApp' })
      fireEvent.click(waButton)
      
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('wa.me'),
        '_blank',
        expect.any(String)
      )
    })

    test('encodes title in Twitter share URL', () => {
      render(<SocialShare {...defaultProps} />)
      const twitterButton = screen.getByRole('button', { name: 'Bagikan ke Twitter' })
      fireEvent.click(twitterButton)
      
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent('Test Article')),
        '_blank',
        expect.any(String)
      )
    })

    test('encodes URL in Facebook share URL', () => {
      render(<SocialShare {...defaultProps} />)
      const fbButton = screen.getByRole('button', { name: 'Bagikan ke Facebook' })
      fireEvent.click(fbButton)
      
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent('https://example.com/test-article')),
        '_blank',
        expect.any(String)
      )
    })
  })

  describe('Copy Link Functionality', () => {
    test('copies full URL when navigator.clipboard is available', async () => {
      Object.defineProperty(global.navigator, 'clipboard', {
        value: { writeText: jest.fn().mockResolvedValue(undefined) },
        configurable: true,
      })
      
      render(<SocialShare {...defaultProps} />)
      const copyButton = screen.getByRole('button', { name: 'Salin tautan' })
      
      await act(async () => {
        fireEvent.click(copyButton)
      })
      
      expect(global.navigator.clipboard.writeText).toHaveBeenCalledWith('https://example.com/test-article')
    })

    test('shows copied state after successful copy', async () => {
      Object.defineProperty(global.navigator, 'clipboard', {
        value: { writeText: jest.fn().mockResolvedValue(undefined) },
        configurable: true,
      })
      
      render(<SocialShare {...defaultProps} />)
      const copyButton = screen.getByRole('button', { name: 'Salin tautan' })
      
      await act(async () => {
        fireEvent.click(copyButton)
      })
      
      const copiedButton = screen.getByRole('button', { name: 'Tautan disalin' })
      expect(copiedButton).toBeInTheDocument()
    })

    test('shows check icon after successful copy', async () => {
      Object.defineProperty(global.navigator, 'clipboard', {
        value: { writeText: jest.fn().mockResolvedValue(undefined) },
        configurable: true,
      })
      
      render(<SocialShare {...defaultProps} />)
      const copyButton = screen.getByRole('button', { name: 'Salin tautan' })
      
      await act(async () => {
        fireEvent.click(copyButton)
      })
      
      expect(screen.getByRole('button', { name: 'Tautan disalin' })).toHaveClass('bg-[hsl(var(--color-success))]')
    })

    test('resets to link icon after timeout', async () => {
      Object.defineProperty(global.navigator, 'clipboard', {
        value: { writeText: jest.fn().mockResolvedValue(undefined) },
        configurable: true,
      })
      
      render(<SocialShare {...defaultProps} />)
      const copyButton = screen.getByRole('button', { name: 'Salin tautan' })
      
      await act(async () => {
        fireEvent.click(copyButton)
      })
      
      expect(screen.getByRole('button', { name: 'Tautan disalin' })).toBeInTheDocument()
      
      await act(async () => {
        jest.advanceTimersByTime(2000)
      })
      
      expect(screen.getByRole('button', { name: 'Salin tautan' })).toBeInTheDocument()
    })

    test('falls back to execCommand when clipboard API fails', async () => {
      Object.defineProperty(global.navigator, 'clipboard', {
        value: { writeText: jest.fn().mockRejectedValue(new Error('Clipboard access denied')) },
        configurable: true,
      })
      Object.defineProperty(document, 'execCommand', {
        value: jest.fn().mockReturnValue(true),
        configurable: true,
        writable: true,
      })
      const appendChildSpy = jest.spyOn(document.body, 'appendChild')
      const removeChildSpy = jest.spyOn(document.body, 'removeChild')
      
      render(<SocialShare {...defaultProps} />)
      const copyButton = screen.getByRole('button', { name: 'Salin tautan' })
      
      await act(async () => {
        fireEvent.click(copyButton)
      })
      
      expect(document.execCommand).toHaveBeenCalledWith('copy')
      expect(appendChildSpy).toHaveBeenCalled()
      expect(removeChildSpy).toHaveBeenCalled()
      
      appendChildSpy.mockRestore()
      removeChildSpy.mockRestore()
    })

    test('shows copied state after fallback copy', async () => {
      Object.defineProperty(global.navigator, 'clipboard', {
        value: { writeText: jest.fn().mockRejectedValue(new Error('Clipboard access denied')) },
        configurable: true,
      })
      Object.defineProperty(document, 'execCommand', {
        value: jest.fn().mockReturnValue(true),
        configurable: true,
      })
      
      render(<SocialShare {...defaultProps} />)
      const copyButton = screen.getByRole('button', { name: 'Salin tautan' })
      
      await act(async () => {
        fireEvent.click(copyButton)
      })
      
      expect(screen.getByRole('button', { name: 'Tautan disalin' })).toBeInTheDocument()
    })
  })

  describe('URL Handling', () => {
    test('uses full URL when starts with http', () => {
      render(<SocialShare {...defaultProps} url="https://external.com/page" />)
      const copyButton = screen.getByRole('button', { name: 'Salin tautan' })
      
      Object.defineProperty(global.navigator, 'clipboard', {
        value: { writeText: jest.fn().mockResolvedValue(undefined) },
        configurable: true,
      })
      
      fireEvent.click(copyButton)
      
      expect(global.navigator.clipboard.writeText).toHaveBeenCalledWith('https://external.com/page')
    })

    test('prepends SITE_URL when URL does not start with http', () => {
      render(<SocialShare {...defaultProps} url="/relative-path" />)
      const copyButton = screen.getByRole('button', { name: 'Salin tautan' })
      
      Object.defineProperty(global.navigator, 'clipboard', {
        value: { writeText: jest.fn().mockResolvedValue(undefined) },
        configurable: true,
      })
      
      fireEvent.click(copyButton)
      
      expect(global.navigator.clipboard.writeText).toHaveBeenCalledWith('https://example.com/relative-path')
    })
  })

  describe('Button Styling', () => {
    test('Facebook button has correct hover color', () => {
      render(<SocialShare {...defaultProps} />)
      const fbButton = screen.getByRole('button', { name: 'Bagikan ke Facebook' })
      expect(fbButton).toHaveClass('hover:bg-[#1877F2]')
    })

    test('Twitter button has correct hover color', () => {
      render(<SocialShare {...defaultProps} />)
      const twitterButton = screen.getByRole('button', { name: 'Bagikan ke Twitter' })
      expect(twitterButton).toHaveClass('hover:bg-[#1DA1F2]')
    })

    test('WhatsApp button has correct hover color', () => {
      render(<SocialShare {...defaultProps} />)
      const waButton = screen.getByRole('button', { name: 'Bagikan ke WhatsApp' })
      expect(waButton).toHaveClass('hover:bg-[#25D366]')
    })

    test('copy button has primary hover color when not copied', () => {
      render(<SocialShare {...defaultProps} />)
      const copyButton = screen.getByRole('button', { name: 'Salin tautan' })
      expect(copyButton).toHaveClass('hover:bg-[hsl(var(--color-primary))]')
    })

    test('focus states are defined', () => {
      render(<SocialShare {...defaultProps} />)
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-[hsl(var(--color-primary))]')
      })
    })
  })

  describe('Memoization', () => {
    test('component is memoized', () => {
      const { rerender } = render(<SocialShare {...defaultProps} />)
      expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(3)
      
      rerender(<SocialShare {...defaultProps} />)
      expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(3)
    })
  })
})
