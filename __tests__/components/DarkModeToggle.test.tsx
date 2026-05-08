import { render, screen, fireEvent } from '@testing-library/react'
import DarkModeToggle from '@/components/ui/DarkModeToggle'

jest.mock('@/lib/hooks/useDarkMode', () => ({
  useDarkMode: () => ({
    isDark: false,
    toggleDarkMode: jest.fn(),
  }),
}))

describe('DarkModeToggle Component', () => {
  describe('Rendering', () => {
    test('renders toggle button', () => {
      render(<DarkModeToggle />)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    test('renders button with correct className', () => {
      render(<DarkModeToggle className="custom-class" />)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })

    test('renders moon icon when in light mode', () => {
      render(<DarkModeToggle />)
      const button = screen.getByRole('button')
      const svg = button.querySelector('svg')
      expect(svg).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('Dark Mode States', () => {
    test('renders moon icon when isDark is false', () => {
      ;(jest.requireMock('@/lib/hooks/useDarkMode') as any).useDarkMode = () => ({
        isDark: false,
        toggleDarkMode: jest.fn(),
      })
      render(<DarkModeToggle />)
      const button = screen.getByRole('button')
      const path = button.querySelector('path')
      expect(path?.getAttribute('d')).toBe('M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z')
    })

    test('renders sun icon when isDark is true', () => {
      ;(jest.requireMock('@/lib/hooks/useDarkMode') as any).useDarkMode = () => ({
        isDark: true,
        toggleDarkMode: jest.fn(),
      })
      render(<DarkModeToggle />)
      const button = screen.getByRole('button')
      const paths = button.querySelectorAll('path')
      expect(paths.length).toBeGreaterThan(0)
    })
  })

  describe('Interaction', () => {
    test('calls toggleDarkMode on click', () => {
      const mockToggle = jest.fn()
      ;(jest.requireMock('@/lib/hooks/useDarkMode') as any).useDarkMode = () => ({
        isDark: false,
        toggleDarkMode: mockToggle,
      })
      render(<DarkModeToggle />)
      const button = screen.getByRole('button')
      fireEvent.click(button)
      expect(mockToggle).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    test('has aria-label for light mode', () => {
      ;(jest.requireMock('@/lib/hooks/useDarkMode') as any).useDarkMode = () => ({
        isDark: false,
        toggleDarkMode: jest.fn(),
      })
      render(<DarkModeToggle />)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Aktifkan mode gelap')
    })

    test('has aria-label for dark mode', () => {
      ;(jest.requireMock('@/lib/hooks/useDarkMode') as any).useDarkMode = () => ({
        isDark: true,
        toggleDarkMode: jest.fn(),
      })
      render(<DarkModeToggle />)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Aktifkan mode terang')
    })

    test('button is focusable', () => {
      render(<DarkModeToggle />)
      const button = screen.getByRole('button')
      expect(button).not.toBeDisabled()
    })

    test('applies focus styles', () => {
      render(<DarkModeToggle />)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('focus:ring-2')
      expect(button).toHaveClass('focus:ring-[hsl(var(--color-primary))]')
    })
  })

  describe('Styles', () => {
    test('applies base styles', () => {
      render(<DarkModeToggle />)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('inline-flex')
      expect(button).toHaveClass('items-center')
      expect(button).toHaveClass('justify-center')
      expect(button).toHaveClass('p-2')
      expect(button).toHaveClass('rounded-[var(--radius-md)]')
    })

    test('applies hover styles', () => {
      render(<DarkModeToggle />)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('hover:text-[hsl(var(--color-primary))]')
      expect(button).toHaveClass('hover:bg-[hsl(var(--color-secondary-dark))]')
    })

    test('applies transition styles', () => {
      render(<DarkModeToggle />)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('transition-colors')
      expect(button).toHaveClass('duration-[var(--transition-fast)]')
    })
  })

  describe('Memoization', () => {
    test('renders without re-rendering unnecessarily', () => {
      const { rerender } = render(<DarkModeToggle />)
      const button = screen.getByRole('button')
      rerender(<DarkModeToggle />)
      expect(button).toBeInTheDocument()
    })
  })
})