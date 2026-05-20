import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SocialShare from '@/components/ui/SocialShare'

const mockClipboard = {
  writeText: jest.fn(),
}

Object.defineProperty(navigator, 'clipboard', {
  value: mockClipboard,
  writable: true,
})

describe('SocialShare Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(window, 'open').mockImplementation(() => null)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Rendering', () => {
    test('renders social share buttons', () => {
      render(<SocialShare title="Test Title" url="/test-url" />)
      expect(screen.getByLabelText('Bagikan ke Facebook')).toBeInTheDocument()
      expect(screen.getByLabelText('Bagikan ke Twitter')).toBeInTheDocument()
      expect(screen.getByLabelText('Bagikan ke WhatsApp')).toBeInTheDocument()
      expect(screen.getByLabelText('Salin tautan')).toBeInTheDocument()
    })

    test('applies custom className', () => {
      render(<SocialShare title="Test" url="/test" className="custom-class" />)
      const buttons = screen.getAllByRole('button')
      expect(buttons[0].parentElement?.parentElement).toHaveClass('custom-class')
    })
  })

  describe('Share Functionality', () => {
    test('opens Facebook share window', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const facebookButton = screen.getByLabelText('Bagikan ke Facebook')
      fireEvent.click(facebookButton)
      expect(window.open).toHaveBeenCalled()
    })

    test('opens Twitter share window', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const twitterButton = screen.getByLabelText('Bagikan ke Twitter')
      fireEvent.click(twitterButton)
      expect(window.open).toHaveBeenCalled()
    })

    test('opens WhatsApp share window', () => {
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      const whatsappButton = screen.getByLabelText('Bagikan ke WhatsApp')
      fireEvent.click(whatsappButton)
      expect(window.open).toHaveBeenCalled()
    })
  })

  describe('Copy Link Functionality', () => {
    test('calls clipboard API when available', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined)
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      const copyButton = screen.getByLabelText('Salin tautan')
      fireEvent.click(copyButton)
      
      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith('https://example.com/test')
      })
    })

    test('handles clipboard API error gracefully', async () => {
      mockClipboard.writeText.mockRejectedValue(new Error('Clipboard error'))
      const execCommandMock = jest.fn()
      Object.defineProperty(document, 'execCommand', {
        value: execCommandMock,
        writable: true,
      })
      
      render(<SocialShare title="Test Title" url="/test" />)
      
      const copyButton = screen.getByLabelText('Salin tautan')
      fireEvent.click(copyButton)
      
      await waitFor(() => {
        expect(execCommandMock).toHaveBeenCalledWith('copy')
      })
    })
  })

  describe('URL Handling', () => {
    test('handles relative URL', () => {
      render(<SocialShare title="Test" url="/relative-path" />)
      expect(screen.getByLabelText('Salin tautan')).toBeInTheDocument()
    })

    test('handles absolute URL', () => {
      render(<SocialShare title="Test" url="https://example.com/path" />)
      expect(screen.getByLabelText('Salin tautan')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    test('buttons have proper aria-labels', () => {
      render(<SocialShare title="Test" url="/test" />)
      expect(screen.getAllByLabelText(/Bagikan ke/).length).toBe(3)
    })

    test('all share buttons have titles', () => {
      render(<SocialShare title="Test" url="/test" />)
      expect(screen.getByTitle('Bagikan ke Facebook')).toBeInTheDocument()
      expect(screen.getByTitle('Bagikan ke Twitter')).toBeInTheDocument()
      expect(screen.getByTitle('Bagikan ke WhatsApp')).toBeInTheDocument()
    })
  })
})