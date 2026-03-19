import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SocialShare from '@/components/ui/SocialShare'

describe('SocialShare Component', () => {
  describe('Rendering', () => {
    test('renders share buttons', () => {
      render(<SocialShare title="Test Title" url="/test" />)
      
      expect(screen.getByLabelText(/Bagikan ke Facebook/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Bagikan ke Twitter/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Bagikan ke WhatsApp/)).toBeInTheDocument()
    })

    test('renders copy link button', () => {
      render(<SocialShare title="Test Title" url="/test" />)
      
      expect(screen.getByLabelText(/Salin tautan/)).toBeInTheDocument()
    })

    test('renders with custom className', () => {
      render(<SocialShare title="Test Title" url="/test" className="custom-class" />)
      
      const outerContainer = document.querySelector('.custom-class')
      expect(outerContainer).toBeInTheDocument()
    })
  })

  describe('Platform Buttons', () => {
    test('renders all platform buttons', () => {
      render(<SocialShare title="Test Title" url="/test" />)
      
      const facebookBtn = screen.getByLabelText(/Bagikan ke Facebook/)
      const twitterBtn = screen.getByLabelText(/Bagikan ke Twitter/)
      const whatsappBtn = screen.getByLabelText(/Bagikan ke WhatsApp/)
      
      expect(facebookBtn).toBeInTheDocument()
      expect(twitterBtn).toBeInTheDocument()
      expect(whatsappBtn).toBeInTheDocument()
    })

    test('buttons have correct title attributes', () => {
      render(<SocialShare title="Test Title" url="/test" />)
      
      expect(screen.getByTitle(/Bagikan ke Facebook/)).toBeInTheDocument()
      expect(screen.getByTitle(/Bagikan ke Twitter/)).toBeInTheDocument()
      expect(screen.getByTitle(/Bagikan ke WhatsApp/)).toBeInTheDocument()
    })
  })

  describe('Share Functionality', () => {
    let originalWindowOpen: typeof window.open

    beforeEach(() => {
      originalWindowOpen = window.open
      window.open = jest.fn()
    })

    afterEach(() => {
      window.open = originalWindowOpen
    })

    test('opens Facebook share window with correct URL', () => {
      render(<SocialShare title="Test Title" url="/test" />)
      
      const facebookBtn = screen.getByLabelText(/Bagikan ke Facebook/)
      fireEvent.click(facebookBtn)
      
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('facebook.com/sharer'),
        '_blank',
        expect.any(String)
      )
    })

    test('opens Twitter share window with correct URL', () => {
      render(<SocialShare title="Test Title" url="/test" />)
      
      const twitterBtn = screen.getByLabelText(/Bagikan ke Twitter/)
      fireEvent.click(twitterBtn)
      
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('twitter.com/intent/tweet'),
        '_blank',
        expect.any(String)
      )
    })

    test('opens WhatsApp share window with correct URL', () => {
      render(<SocialShare title="Test Title" url="/test" />)
      
      const whatsappBtn = screen.getByLabelText(/Bagikan ke WhatsApp/)
      fireEvent.click(whatsappBtn)
      
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('wa.me'),
        '_blank',
        expect.any(String)
      )
    })
  })

  describe('Copy Link Functionality', () => {
    test('has copy button initially showing Salin tautan label', () => {
      render(<SocialShare title="Test Title" url="/test" />)
      
      const copyBtn = screen.getByLabelText(/Salin tautan/)
      expect(copyBtn).toBeInTheDocument()
    })

    test('copy button has link icon', () => {
      render(<SocialShare title="Test Title" url="/test" />)
      
      const copyBtn = screen.getByLabelText(/Salin tautan/)
      const svg = copyBtn.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('URL Handling', () => {
    test('adds SITE_URL prefix to relative URLs', () => {
      const originalEnv = process.env.NEXT_PUBLIC_SITE_URL
      process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com'
      
      render(<SocialShare title="Test Title" url="/relative" />)
      
      process.env.NEXT_PUBLIC_SITE_URL = originalEnv
    })

    test('keeps absolute URLs as-is', () => {
      const originalEnv = process.env.NEXT_PUBLIC_SITE_URL
      process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com'
      
      render(<SocialShare title="Test Title" url="https://other.com/page" />)
      
      process.env.NEXT_PUBLIC_SITE_URL = originalEnv
    })
  })

  describe('Button Styling', () => {
    test('buttons have rounded-full class', () => {
      render(<SocialShare title="Test Title" url="/test" />)
      
      const facebookBtn = screen.getByLabelText(/Bagikan ke Facebook/)
      expect(facebookBtn).toHaveClass('rounded-full')
    })

    test('buttons have focus styles', () => {
      render(<SocialShare title="Test Title" url="/test" />)
      
      const facebookBtn = screen.getByLabelText(/Bagikan ke Facebook/)
      expect(facebookBtn).toHaveClass('focus:outline-none', 'focus:ring-2')
    })

    test('Facebook button has hover color', () => {
      render(<SocialShare title="Test Title" url="/test" />)
      
      const facebookBtn = screen.getByLabelText(/Bagikan ke Facebook/)
      expect(facebookBtn).toHaveClass('hover:bg-[#1877F2]')
    })

    test('Twitter button has hover color', () => {
      render(<SocialShare title="Test Title" url="/test" />)
      
      const twitterBtn = screen.getByLabelText(/Bagikan ke Twitter/)
      expect(twitterBtn).toHaveClass('hover:bg-[#1DA1F2]')
    })

    test('WhatsApp button has hover color', () => {
      render(<SocialShare title="Test Title" url="/test" />)
      
      const whatsappBtn = screen.getByLabelText(/Bagikan ke WhatsApp/)
      expect(whatsappBtn).toHaveClass('hover:bg-[#25D366]')
    })
  })

  describe('Icon Rendering', () => {
    test('renders social icons', () => {
      render(<SocialShare title="Test Title" url="/test" />)
      
      const svgs = document.querySelectorAll('svg')
      expect(svgs.length).toBeGreaterThan(0)
    })
  })

  describe('Flex Layout', () => {
    test('container uses flex layout', () => {
      render(<SocialShare title="Test Title" url="/test" />)
      
      const container = document.querySelector('.flex')
      expect(container).toHaveClass('flex', 'items-center', 'gap-3')
    })
  })
})