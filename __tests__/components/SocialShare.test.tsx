import { render, screen } from '@testing-library/react'
import SocialShare from '@/components/ui/SocialShare'

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

describe('SocialShare Component', () => {
  describe('Rendering', () => {
    test('renders share buttons', () => {
      render(<SocialShare title="Test Article" url="/test-article" />)

      expect(screen.getAllByRole('button')).toHaveLength(4)
    })

    test('renders Facebook share button', () => {
      render(<SocialShare title="Test Article" url="/test-article" />)

      expect(screen.getByLabelText('Bagikan ke Facebook')).toBeInTheDocument()
    })

    test('renders Twitter share button', () => {
      render(<SocialShare title="Test Article" url="/test-article" />)

      expect(screen.getByLabelText('Bagikan ke Twitter')).toBeInTheDocument()
    })

    test('renders WhatsApp share button', () => {
      render(<SocialShare title="Test Article" url="/test-article" />)

      expect(screen.getByLabelText('Bagikan ke WhatsApp')).toBeInTheDocument()
    })

    test('renders copy link button initially', () => {
      render(<SocialShare title="Test Article" url="/test-article" />)

      expect(screen.getByLabelText('Salin tautan')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    test('has proper focus indicators', () => {
      render(<SocialShare title="Test Article" url="/test-article" />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveClass('focus:ring-2')
        expect(button).toHaveClass('focus:ring-[hsl(var(--color-primary))]')
      })
    })

    test('has aria-label on all buttons', () => {
      render(<SocialShare title="Test Article" url="/test-article" />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label')
      })
    })
  })

  describe('Platform buttons have correct colors', () => {
    test('Facebook button has correct color class', () => {
      render(<SocialShare title="Test Article" url="/test-article" />)

      const fbButton = screen.getByLabelText('Bagikan ke Facebook')
      expect(fbButton).toHaveClass('hover:bg-[#1877F2]')
    })

    test('Twitter button has correct color class', () => {
      render(<SocialShare title="Test Article" url="/test-article" />)

      const twitterButton = screen.getByLabelText('Bagikan ke Twitter')
      expect(twitterButton).toHaveClass('hover:bg-[#1DA1F2]')
    })

    test('WhatsApp button has correct color class', () => {
      render(<SocialShare title="Test Article" url="/test-article" />)

      const waButton = screen.getByLabelText('Bagikan ke WhatsApp')
      expect(waButton).toHaveClass('hover:bg-[#25D366]')
    })
  })
})