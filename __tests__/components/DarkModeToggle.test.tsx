import { render, screen, fireEvent } from '@testing-library/react'
import DarkModeToggle from '@/components/ui/DarkModeToggle'

describe('DarkModeToggle Component', () => {
  describe('Rendering', () => {
    test('renders toggle button', () => {
      render(<DarkModeToggle />)
      const toggleButton = screen.getByRole('button')
      expect(toggleButton).toBeInTheDocument()
    })

    test('renders moon icon in light mode', () => {
      render(<DarkModeToggle />)
      const button = screen.getByRole('button')
      const moonIcon = button.querySelector('svg')
      expect(moonIcon).toBeInTheDocument()
    })

    test('renders with custom className', () => {
      render(<DarkModeToggle className="custom-class" />)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })
  })

  describe('Accessibility', () => {
    test('has aria-label for light mode', () => {
      render(<DarkModeToggle />)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Aktifkan mode gelap')
    })

    test('is keyboard accessible', () => {
      render(<DarkModeToggle />)
      const button = screen.getByRole('button')
      expect(button).toBeEnabled()
    })

    test('has focus styles', () => {
      render(<DarkModeToggle />)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('focus:ring-2')
    })
  })

  describe('Interaction', () => {
    test('toggles on click', () => {
      render(<DarkModeToggle />)
      const button = screen.getByRole('button')
      
      fireEvent.click(button)
      
      expect(button).toHaveAttribute('aria-label', 'Aktifkan mode terang')
    })
  })

  describe('Design Tokens', () => {
    test('uses design tokens for colors', () => {
      render(<DarkModeToggle />)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('text-[hsl(var(--color-text-primary))]')
    })

    test('uses design tokens for hover', () => {
      render(<DarkModeToggle />)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('hover:bg-[hsl(var(--color-secondary-dark))]')
    })

    test('uses design tokens for rounded corners', () => {
      render(<DarkModeToggle />)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('rounded-[var(--radius-md)]')
    })
  })
})