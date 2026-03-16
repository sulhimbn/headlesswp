import { render, screen, fireEvent } from '@testing-library/react'
import SocialShare from '@/components/ui/SocialShare'

const mockTitle = 'Test Article Title'
const mockUrl = '/test-article'

describe('SocialShare Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
      writable: true,
    })
  })

  test('renders social share buttons', () => {
    render(<SocialShare title={mockTitle} url={mockUrl} />)
    
    expect(screen.getByRole('button', { name: /bagikan ke facebook/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /bagikan ke twitter/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /bagikan ke whatsapp/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /salin tautan/i })).toBeInTheDocument()
  })

  test('renders with custom className', () => {
    const { container } = render(
      <SocialShare title={mockTitle} url={mockUrl} className="custom-share-class" />
    )
    
    const div = container.firstChild as HTMLElement
    expect(div).toHaveClass('custom-share-class')
  })

  test('opens Facebook share window', () => {
    const windowOpenMock = jest.fn()
    window.open = windowOpenMock

    render(<SocialShare title={mockTitle} url={mockUrl} />)
    
    const facebookButton = screen.getByRole('button', { name: /bagikan ke facebook/i })
    fireEvent.click(facebookButton)

    expect(windowOpenMock).toHaveBeenCalledWith(
      expect.stringContaining('facebook.com/sharer'),
      '_blank',
      expect.stringContaining('width=600')
    )
  })

  test('opens Twitter share window', () => {
    const windowOpenMock = jest.fn()
    window.open = windowOpenMock

    render(<SocialShare title={mockTitle} url={mockUrl} />)
    
    const twitterButton = screen.getByRole('button', { name: /bagikan ke twitter/i })
    fireEvent.click(twitterButton)

    expect(windowOpenMock).toHaveBeenCalledWith(
      expect.stringContaining('twitter.com/intent/tweet'),
      '_blank',
      expect.stringContaining('width=600')
    )
  })

  test('opens WhatsApp share window', () => {
    const windowOpenMock = jest.fn()
    window.open = windowOpenMock

    render(<SocialShare title={mockTitle} url={mockUrl} />)
    
    const whatsappButton = screen.getByRole('button', { name: /bagikan ke whatsapp/i })
    fireEvent.click(whatsappButton)

    expect(windowOpenMock).toHaveBeenCalledWith(
      expect.stringContaining('wa.me'),
      '_blank',
      expect.stringContaining('width=600')
    )
  })

  test('copies link to clipboard when button clicked', () => {
    render(<SocialShare title={mockTitle} url={mockUrl} />)
    
    const copyButton = screen.getByRole('button', { name: /salin tautan/i })
    fireEvent.click(copyButton)

    expect(navigator.clipboard.writeText).toHaveBeenCalled()
  })

  test('handles absolute URL', () => {
    const absoluteUrl = 'https://example.com/article'
    render(<SocialShare title={mockTitle} url={absoluteUrl} />)
    
    const copyButton = screen.getByRole('button', { name: /salin tautan/i })
    fireEvent.click(copyButton)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(absoluteUrl)
  })

  test('prepends SITE_URL for relative URLs', () => {
    render(<SocialShare title={mockTitle} url="/relative-path" />)
    
    const copyButton = screen.getByRole('button', { name: /salin tautan/i })
    fireEvent.click(copyButton)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringMatching(/^https?:\/\//)
    )
  })

  test('renders all platform buttons', () => {
    render(<SocialShare title={mockTitle} url={mockUrl} />)
    
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(4)
  })

  test('has proper focus styles', () => {
    render(<SocialShare title={mockTitle} url={mockUrl} />)
    
    const facebookButton = screen.getByRole('button', { name: /bagikan ke facebook/i })
    expect(facebookButton).toHaveClass('focus:outline-none')
    expect(facebookButton).toHaveClass('focus:ring-2')
  })

  test('button shows title tooltip', () => {
    render(<SocialShare title={mockTitle} url={mockUrl} />)
    
    const facebookButton = screen.getByRole('button', { name: /bagikan ke facebook/i })
    expect(facebookButton).toHaveAttribute('title', 'Bagikan ke Facebook')
  })

  test('copy button has initial tooltip', () => {
    render(<SocialShare title={mockTitle} url={mockUrl} />)
    
    expect(screen.getByRole('button', { name: /salin tautan/i })).toHaveAttribute(
      'title',
      'Salin tautan'
    )
  })
})
