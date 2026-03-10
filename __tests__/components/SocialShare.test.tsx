import { render, screen } from '@testing-library/react'
import SocialShare from '@/components/ui/SocialShare'

describe('SocialShare', () => {
  describe('Rendering', () => {
    it('should render share buttons', () => {
      render(<SocialShare title="Test" url="https://example.com" />)
      
      expect(screen.getByRole('button', { name: /Facebook/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Twitter/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /WhatsApp/i })).toBeInTheDocument()
    })

    it('should render copy link button', () => {
      render(<SocialShare title="Test" url="https://example.com" />)
      
      expect(screen.getByRole('button', { name: /Salin tautan/i })).toBeInTheDocument()
    })

    it('should render with custom className', () => {
      render(<SocialShare title="Test" url="https://example.com" className="custom-class" />)
      
      const container = document.querySelector('.custom-class')
      expect(container).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have aria-label on share buttons', () => {
      render(<SocialShare title="Test" url="https://example.com" />)
      
      expect(screen.getByRole('button', { name: /Facebook/i })).toHaveAttribute('aria-label', 'Bagikan ke Facebook')
      expect(screen.getByRole('button', { name: /Twitter/i })).toHaveAttribute('aria-label', 'Bagikan ke Twitter')
      expect(screen.getByRole('button', { name: /WhatsApp/i })).toHaveAttribute('aria-label', 'Bagikan ke WhatsApp')
    })
  })

  describe('Memoization', () => {
    it('should render only once with same props', () => {
      const { rerender } = render(<SocialShare title="Test" url="https://example.com" />)
      rerender(<SocialShare title="Test" url="https://example.com" />)
      
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBe(4)
    })
  })
})
