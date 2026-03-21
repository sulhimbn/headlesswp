import { render, screen } from '@testing-library/react'
import SocialShare from '@/components/ui/SocialShare'

describe('SocialShare Component', () => {
  const mockOpen = jest.fn()
  const mockWriteText = jest.fn().mockResolvedValue(undefined)
  const mockExecCommand = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    window.open = mockOpen
    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      value: {
        writeText: mockWriteText,
      },
    })
    document.execCommand = mockExecCommand
  })

  describe('Rendering', () => {
    test('renders all social platform buttons', () => {
      render(<SocialShare title="Test" url="https://example.com" />)

      expect(screen.getByRole('button', { name: 'Bagikan ke Facebook' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Bagikan ke Twitter' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Bagikan ke WhatsApp' })).toBeInTheDocument()
    })

    test('renders copy link button', () => {
      render(<SocialShare title="Test" url="https://example.com" />)

      const copyButton = screen.getByRole('button', { name: 'Salin tautan' })
      expect(copyButton).toBeInTheDocument()
    })

    test('renders with custom className', () => {
      render(<SocialShare title="Test" url="https://example.com" className="custom-class" />)

      const container = document.querySelector('.custom-class')
      expect(container).toBeInTheDocument()
    })
  })

  describe('URL handling', () => {
    test('uses full URL when starts with http', () => {
      render(<SocialShare title="Test" url="https://example.com/post" />)

      const facebookButton = screen.getByRole('button', { name: 'Bagikan ke Facebook' })
      facebookButton.click()

      expect(mockOpen).toHaveBeenCalledWith(
        'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fexample.com%2Fpost',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('prepends SITE_URL when URL does not start with http', () => {
      render(<SocialShare title="Test" url="/blog/my-post" />)

      const facebookButton = screen.getByRole('button', { name: 'Bagikan ke Facebook' })
      facebookButton.click()

      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('http'),
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })
  })

  describe('Social sharing', () => {
    test('opens Facebook share dialog with correct URL', () => {
      render(<SocialShare title="My Post Title" url="https://example.com/post" />)

      const facebookButton = screen.getByRole('button', { name: 'Bagikan ke Facebook' })
      facebookButton.click()

      expect(mockOpen).toHaveBeenCalledWith(
        'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fexample.com%2Fpost',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('opens Twitter share dialog with encoded title and URL', () => {
      render(<SocialShare title="My Post Title" url="https://example.com/post" />)

      const twitterButton = screen.getByRole('button', { name: 'Bagikan ke Twitter' })
      twitterButton.click()

      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('text=My%20Post%20Title'),
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('url=https%3A%2F%2Fexample.com%2Fpost'),
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })

    test('opens WhatsApp share dialog with title and URL', () => {
      render(<SocialShare title="My Post Title" url="https://example.com/post" />)

      const whatsappButton = screen.getByRole('button', { name: 'Bagikan ke WhatsApp' })
      whatsappButton.click()

      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('text=My%20Post%20Title'),
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
    })
  })

  describe('Copy link functionality', () => {
    test('copies link using clipboard API when available', async () => {
      render(<SocialShare title="Test" url="https://example.com/post" />)

      const copyButton = screen.getByRole('button', { name: 'Salin tautan' })
      copyButton.click()

      expect(mockWriteText).toHaveBeenCalledWith('https://example.com/post')
    })

    test('shows copied state after successful copy', async () => {
      render(<SocialShare title="Test" url="https://example.com/post" />)

      const copyButton = screen.getByRole('button', { name: 'Salin tautan' })
      copyButton.click()

      const copiedButton = await screen.findByRole('button', { name: 'Tautan disalin' })
      expect(copiedButton).toBeInTheDocument()
    })

    test('falls back to execCommand when clipboard API fails', async () => {
      mockWriteText.mockRejectedValueOnce(new Error('Clipboard API not available'))

      render(<SocialShare title="Test" url="https://example.com/post" />)

      const copyButton = screen.getByRole('button', { name: 'Salin tautan' })
      copyButton.click()

      await new Promise(resolve => setTimeout(resolve, 10))

      expect(mockExecCommand).toHaveBeenCalledWith('copy')
    })

    test('resets copied state after timeout', async () => {
      jest.useFakeTimers()

      render(<SocialShare title="Test" url="https://example.com/post" />)

      const copyButton = screen.getByRole('button', { name: 'Salin tautan' })
      copyButton.click()

      await screen.findByRole('button', { name: 'Tautan disalin' })

      jest.advanceTimersByTime(2000)

      await screen.findByRole('button', { name: 'Salin tautan' })

      jest.useRealTimers()
    })
  })

  describe('Accessibility', () => {
    test('has correct aria-labels for social buttons', () => {
      render(<SocialShare title="Test" url="https://example.com" />)

      expect(screen.getByRole('button', { name: 'Bagikan ke Facebook' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Bagikan ke Twitter' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Bagikan ke WhatsApp' })).toBeInTheDocument()
    })

    test('has correct aria-label for copy button', () => {
      render(<SocialShare title="Test" url="https://example.com" />)

      expect(screen.getByRole('button', { name: 'Salin tautan' })).toBeInTheDocument()
    })

    test('updates aria-label when copied', async () => {
      render(<SocialShare title="Test" url="https://example.com/post" />)

      const copyButton = screen.getByRole('button', { name: 'Salin tautan' })
      copyButton.click()

      const copiedButton = await screen.findByRole('button', { name: 'Tautan disalin' })
      expect(copiedButton).toBeInTheDocument()
    })
  })

  describe('Visual feedback', () => {
    test('shows check icon when copied', async () => {
      render(<SocialShare title="Test" url="https://example.com/post" />)

      const copyButton = screen.getByRole('button', { name: 'Salin tautan' })
      copyButton.click()

      const copiedButton = await screen.findByRole('button', { name: 'Tautan disalin' })
      expect(copiedButton.querySelector('svg')).toBeInTheDocument()
    })

    test('shows success styling when copied', async () => {
      render(<SocialShare title="Test" url="https://example.com/post" />)

      const copyButton = screen.getByRole('button', { name: 'Salin tautan' })
      copyButton.click()

      const copiedButton = await screen.findByRole('button', { name: 'Tautan disalin' })
      expect(copiedButton).toHaveClass('bg-[hsl(var(--color-success))]')
    })
  })

  describe('Button structure', () => {
    test('renders four share buttons in total', () => {
      render(<SocialShare title="Test" url="https://example.com" />)

      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(4)
    })

    test('buttons have rounded styling', () => {
      render(<SocialShare title="Test" url="https://example.com" />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach((button) => {
        expect(button).toHaveClass('rounded-full')
      })
    })

    test('social buttons have hover color classes', () => {
      render(<SocialShare title="Test" url="https://example.com" />)

      const facebookButton = screen.getByRole('button', { name: 'Bagikan ke Facebook' })
      expect(facebookButton).toHaveClass('hover:bg-[#1877F2]')
    })
  })

  describe('SocialIcon component', () => {
    test('renders facebook icon SVG', () => {
      render(<SocialShare title="Test" url="https://example.com" />)

      const facebookButton = screen.getByRole('button', { name: 'Bagikan ke Facebook' })
      const svg = facebookButton.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('fill', 'currentColor')
    })

    test('renders twitter icon SVG', () => {
      render(<SocialShare title="Test" url="https://example.com" />)

      const twitterButton = screen.getByRole('button', { name: 'Bagikan ke Twitter' })
      const svg = twitterButton.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('fill', 'currentColor')
    })

    test('renders whatsapp icon SVG', () => {
      render(<SocialShare title="Test" url="https://example.com" />)

      const whatsappButton = screen.getByRole('button', { name: 'Bagikan ke WhatsApp' })
      const svg = whatsappButton.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('fill', 'currentColor')
    })

    test('renders link icon SVG for copy button', () => {
      render(<SocialShare title="Test" url="https://example.com" />)

      const copyButton = screen.getByRole('button', { name: 'Salin tautan' })
      const svg = copyButton.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })
})
