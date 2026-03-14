import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import SocialShare from '@/components/ui/SocialShare'

jest.mock('@/lib/api/config', () => ({
  SITE_URL: 'https://example.com',
}))

describe('SocialShare', () => {
  let originalClipboard: Clipboard | undefined
  let originalExecCommand: ((commandId: string, showUI?: boolean, value?: string) => boolean) | undefined

  beforeEach(() => {
    jest.clearAllMocks()
    
    originalClipboard = navigator.clipboard
    originalExecCommand = document.execCommand
    
    global.open = jest.fn()
    
    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      configurable: true,
      value: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
    if (originalClipboard) {
      Object.defineProperty(navigator, 'clipboard', {
        value: originalClipboard,
        writable: true,
        configurable: true,
      })
    }
    if (originalExecCommand !== undefined) {
      document.execCommand = originalExecCommand
    }
  })

  describe('Rendering', () => {
    it('should render share buttons', () => {
      render(<SocialShare title="Test Title" url="/test" />)
      
      expect(screen.getByRole('button', { name: /Bagikan ke Facebook/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Bagikan ke Twitter/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Bagikan ke WhatsApp/i })).toBeInTheDocument()
    })

    it('should render copy link button', () => {
      render(<SocialShare title="Test Title" url="/test" />)
      
      expect(screen.getByRole('button', { name: /Salin tautan/i })).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<SocialShare title="Test Title" url="/test" className="custom-class" />)
      
      const container = document.querySelector('.custom-class')
      expect(container).toBeInTheDocument()
    })
  })

  describe('Share buttons', () => {
    it('should open Facebook share dialog', () => {
      render(<SocialShare title="Test Title" url="/test" />)
      
      const facebookButton = screen.getByRole('button', { name: /Bagikan ke Facebook/i })
      fireEvent.click(facebookButton)
      
      expect(global.open).toHaveBeenCalledWith(
        'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fexample.com%2Ftest',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    it('should open Twitter share dialog', () => {
      render(<SocialShare title="Test Title" url="/test" />)
      
      const twitterButton = screen.getByRole('button', { name: /Bagikan ke Twitter/i })
      fireEvent.click(twitterButton)
      
      expect(global.open).toHaveBeenCalledWith(
        'https://twitter.com/intent/tweet?text=Test%20Title&url=https%3A%2F%2Fexample.com%2Ftest',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    it('should open WhatsApp share dialog', () => {
      render(<SocialShare title="Test Title" url="/test" />)
      
      const whatsappButton = screen.getByRole('button', { name: /Bagikan ke WhatsApp/i })
      fireEvent.click(whatsappButton)
      
      expect(global.open).toHaveBeenCalledWith(
        'https://wa.me/?text=Test%20Title%20https%3A%2F%2Fexample.com%2Ftest',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })
  })

  describe('Clipboard API', () => {
    it('should copy link using clipboard API', async () => {
      render(<SocialShare title="Test Title" url="/test" />)
      
      const copyButton = screen.getByRole('button', { name: /Salin tautan/i })
      fireEvent.click(copyButton)
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://example.com/test')
    })

    it('should show copied state', async () => {
      render(<SocialShare title="Test Title" url="/test" />)
      
      const copyButton = screen.getByRole('button', { name: /Salin tautan/i })
      fireEvent.click(copyButton)
      
      expect(await screen.findByRole('button', { name: /Tautan disalin/i })).toBeInTheDocument()
    })
  })

  describe('URL handling', () => {
    it('should use full URL if already absolute', () => {
      render(<SocialShare title="Test Title" url="https://other.com/page" />)
      
      const twitterButton = screen.getByRole('button', { name: /Bagikan ke Twitter/i })
      fireEvent.click(twitterButton)
      
      expect(global.open).toHaveBeenCalledWith(
        expect.stringContaining('url=https%3A%2F%2Fother.com%2Fpage'),
        '_blank',
        expect.any(String)
      )
    })

    it('should prepend SITE_URL for relative URLs', () => {
      render(<SocialShare title="Test Title" url="/relative/path" />)
      
      const twitterButton = screen.getByRole('button', { name: /Bagikan ke Twitter/i })
      fireEvent.click(twitterButton)
      
      expect(global.open).toHaveBeenCalledWith(
        expect.stringContaining('url=https%3A%2F%2Fexample.com%2Frelative%2Fpath'),
        '_blank',
        expect.any(String)
      )
    })
  })

  describe('Accessibility', () => {
    it('should have proper aria-labels on buttons', () => {
      render(<SocialShare title="Test Title" url="/test" />)
      
      expect(screen.getByRole('button', { name: /Bagikan ke Facebook/i })).toHaveAttribute('aria-label')
      expect(screen.getByRole('button', { name: /Bagikan ke Twitter/i })).toHaveAttribute('aria-label')
      expect(screen.getByRole('button', { name: /Bagikan ke WhatsApp/i })).toHaveAttribute('aria-label')
    })

    it('should update aria-label when copied', async () => {
      render(<SocialShare title="Test Title" url="/test" />)
      
      const copyButton = screen.getByRole('button', { name: /Salin tautan/i })
      fireEvent.click(copyButton)
      
      expect(await screen.findByRole('button', { name: /Tautan disalin/i })).toBeInTheDocument()
    })
  })
})
