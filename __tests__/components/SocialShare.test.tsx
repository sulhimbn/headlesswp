import { render, screen, fireEvent } from '@testing-library/react'
import SocialShare from '@/components/ui/SocialShare'

jest.mock('@/lib/api/config', () => ({
  SITE_URL: 'https://example.com',
}))

describe('SocialShare Component', () => {
  describe('Rendering', () => {
    test('renders social share buttons', () => {
      render(<SocialShare title="Test Title" url="/test" />)
      
      expect(screen.getAllByRole('button').length).toBe(4)
    })

    test('renders with custom className', () => {
      render(<SocialShare title="Test" url="/test" className="custom-class" />)
      const container = document.querySelector('.custom-class')
      expect(container).toBeInTheDocument()
    })
  })

  describe('Sharing', () => {
    test('opens Facebook share window', () => {
      const originalOpen = window.open
      window.open = jest.fn()
      
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      fireEvent.click(screen.getAllByRole('button')[0])
      
      expect(window.open).toHaveBeenCalled()
      expect(window.open).toHaveBeenCalledWith(
        'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fexample.com%2Ftest',
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      )
      
      window.open = originalOpen
    })

    test('opens Twitter share window', () => {
      const originalOpen = window.open
      window.open = jest.fn()
      
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      fireEvent.click(screen.getAllByRole('button')[1])
      
      expect(window.open).toHaveBeenCalled()
      
      window.open = originalOpen
    })

    test('opens WhatsApp share window', () => {
      const originalOpen = window.open
      window.open = jest.fn()
      
      render(<SocialShare title="Test Title" url="https://example.com/test" />)
      
      fireEvent.click(screen.getAllByRole('button')[2])
      
      expect(window.open).toHaveBeenCalled()
      
      window.open = originalOpen
    })
  })

  describe('Accessibility', () => {
    test('has buttons with proper aria-labels', () => {
      render(<SocialShare title="Test" url="/test" />)
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label')
      })
    })

    test('buttons have titles', () => {
      render(<SocialShare title="Test" url="/test" />)
      
      expect(screen.getByTitle('Bagikan ke Facebook')).toBeInTheDocument()
    })
  })
})
