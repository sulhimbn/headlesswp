import { render, screen } from '@testing-library/react'
import SocialShare from '@/components/ui/SocialShare'

jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
}))

jest.mock('@/lib/api/config', () => ({
  SITE_URL: 'https://example.com',
}))

describe('SocialShare Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  const mockTitle = 'Test Article Title'
  const mockUrl = '/berita/test-article'

  describe('Rendering', () => {
    test('renders all social platform buttons', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)

      expect(screen.getByRole('button', { name: /Bagikan ke Facebook/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Bagikan ke Twitter/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Bagikan ke WhatsApp/i })).toBeInTheDocument()
    })

    test('renders copy link button', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)

      expect(screen.getByRole('button', { name: /Salin tautan/i })).toBeInTheDocument()
    })

    test('renders with custom className', () => {
      const { container } = render(<SocialShare title={mockTitle} url={mockUrl} className="custom-class" />)

      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  describe('Accessibility', () => {
    test('share buttons have correct aria-label', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)

      expect(screen.getByLabelText(/Bagikan ke Facebook/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Bagikan ke Twitter/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Bagikan ke WhatsApp/)).toBeInTheDocument()
    })

    test('copy button has aria-label', () => {
      render(<SocialShare title={mockTitle} url={mockUrl} />)

      expect(screen.getByLabelText(/Salin tautan/)).toBeInTheDocument()
    })
  })

  describe('Platforms', () => {
    test('renders 3 share platforms', () => {
      const { container } = render(<SocialShare title={mockTitle} url={mockUrl} />)

      const buttons = container.querySelectorAll('button')
      expect(buttons.length).toBe(4)
    })
  })
})
