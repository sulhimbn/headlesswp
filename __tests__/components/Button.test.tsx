import { render, screen } from '@testing-library/react'
import Button from '@/components/ui/Button'

describe('Button Component', () => {
  describe('Rendering', () => {
    test('renders button with text content', () => {
      render(<button>Click me</button>)
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
    })

    test('renders button with custom className', () => {
      render(<Button className="custom-class">Click me</Button>)
      const button = screen.getByRole('button', { name: 'Click me' })
      expect(button).toHaveClass('custom-class')
    })

    test('renders button with children as node', () => {
      render(
        <Button>
          <span>Icon</span> Text
        </Button>
      )
      expect(screen.getByRole('button')).toHaveTextContent('Icon Text')
    })
  })

  describe('Variants', () => {
    test('renders primary variant by default', () => {
      render(<Button>Click me</Button>)
      const button = screen.getByRole('button', { name: 'Click me' })
      expect(button).toHaveClass('bg-[hsl(var(--color-primary))]')
    })

    test('renders secondary variant', () => {
      render(<Button variant="secondary">Click me</Button>)
      const button = screen.getByRole('button', { name: 'Click me' })
      expect(button).toHaveClass('bg-[hsl(var(--color-secondary-dark))]')
    })

    test('renders outline variant', () => {
      render(<Button variant="outline">Click me</Button>)
      const button = screen.getByRole('button', { name: 'Click me' })
      expect(button).toHaveClass('border-[hsl(var(--color-primary))]')
    })

    test('renders ghost variant', () => {
      render(<Button variant="ghost">Click me</Button>)
      const button = screen.getByRole('button', { name: 'Click me' })
      expect(button).toHaveClass('text-[hsl(var(--color-text-secondary))]')
    })
  })

  describe('Sizes', () => {
    test('renders medium size by default', () => {
      render(<Button>Click me</Button>)
      const button = screen.getByRole('button', { name: 'Click me' })
      expect(button).toHaveClass('px-4 py-2 text-base')
    })

    test('renders small size', () => {
      render(<Button size="sm">Click me</Button>)
      const button = screen.getByRole('button', { name: 'Click me' })
      expect(button).toHaveClass('px-3 py-1.5 text-sm')
    })

    test('renders large size', () => {
      render(<Button size="lg">Click me</Button>)
      const button = screen.getByRole('button', { name: 'Click me' })
      expect(button).toHaveClass('px-6 py-3 text-lg')
    })
  })

  describe('Loading State', () => {
    test('shows loading spinner when isLoading is true', () => {
      render(<Button isLoading>Loading</Button>)
      const button = screen.getByRole('button')
      expect(button.querySelector('.animate-spin')).toBeInTheDocument()
      const loadingIcon = screen.getByRole('status', { name: 'Loading' })
      expect(loadingIcon).toBeInTheDocument()
    })

    test('disables button when isLoading is true', () => {
      render(<Button isLoading>Loading</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    test('sets aria-busy when isLoading is true', () => {
      render(<Button isLoading>Loading</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-busy', 'true')
    })

    test('does not show loading spinner when isLoading is false', () => {
      render(<Button isLoading={false}>Click me</Button>)
      const button = screen.getByRole('button', { name: 'Click me' })
      expect(button.querySelector('.animate-spin')).not.toBeInTheDocument()
    })
  })

  describe('Disabled State', () => {
    test('disables button when disabled prop is true', () => {
      render(<Button disabled>Click me</Button>)
      const button = screen.getByRole('button', { name: 'Click me' })
      expect(button).toBeDisabled()
    })

    test('applies disabled styles', () => {
      render(<Button disabled>Click me</Button>)
      const button = screen.getByRole('button', { name: 'Click me' })
      expect(button).toHaveClass('disabled:opacity-50 disabled:cursor-not-allowed')
    })

    test('does not disable when disabled prop is false', () => {
      render(<Button disabled={false}>Click me</Button>)
      const button = screen.getByRole('button', { name: 'Click me' })
      expect(button).not.toBeDisabled()
    })
  })

  describe('Full Width', () => {
    test('applies full width when fullWidth is true', () => {
      render(<Button fullWidth>Click me</Button>)
      const button = screen.getByRole('button', { name: 'Click me' })
      expect(button).toHaveClass('w-full')
    })

    test('does not apply full width when fullWidth is false', () => {
      render(<Button fullWidth={false}>Click me</Button>)
      const button = screen.getByRole('button', { name: 'Click me' })
      expect(button).not.toHaveClass('w-full')
    })

    test('does not apply full width by default', () => {
      render(<Button>Click me</Button>)
      const button = screen.getByRole('button', { name: 'Click me' })
      expect(button).not.toHaveClass('w-full')
    })
  })

  describe('Accessibility', () => {
    test('button is focusable', () => {
      render(<Button>Click me</Button>)
      const button = screen.getByRole('button', { name: 'Click me' })
      expect(button).toBeEnabled()
    })

    test('applies focus styles', () => {
      render(<Button>Click me</Button>)
      const button = screen.getByRole('button', { name: 'Click me' })
      expect(button).toHaveClass('focus:ring-2 focus:ring-[hsl(var(--color-primary))]')
    })

    test('passes through additional HTML button attributes', () => {
      render(
        <Button type="submit" form="my-form" aria-label="Submit form">
          Submit
        </Button>
      )
      const button = screen.getByRole('button', { name: /Submit/i })
      expect(button).toHaveAttribute('type', 'submit')
      expect(button).toHaveAttribute('form', 'my-form')
      expect(button).toHaveAttribute('aria-label', 'Submit form')
    })

    test('focus styles do not apply when disabled', () => {
      render(<Button disabled>Click me</Button>)
      const button = screen.getByRole('button', { name: 'Click me' })
      expect(button).toHaveClass('focus:outline-none')
    })
  })

  describe('Base Styles', () => {
    test('applies base styles consistently across all variants', () => {
      render(<Button variant="primary">Primary</Button>)
      render(<Button variant="secondary">Secondary</Button>)
      render(<Button variant="outline">Outline</Button>)
      render(<Button variant="ghost">Ghost</Button>)

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveClass('font-medium')
        expect(button).toHaveClass('rounded-[var(--radius-md)]')
        expect(button).toHaveClass('transition-all')
        expect(button).toHaveClass('duration-[var(--transition-normal)]')
      })
    })
  })

  describe('Edge Cases', () => {
    test('renders empty button', () => {
      render(<Button></Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    test('handles disabled with isLoading simultaneously', () => {
      render(<Button disabled isLoading>Loading</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('aria-busy', 'true')
    })

    test('combines variant, size, and fullWidth correctly', () => {
      render(
        <Button variant="secondary" size="lg" fullWidth>
          Combined
        </Button>
      )
      const button = screen.getByRole('button', { name: 'Combined' })
      expect(button).toHaveClass('bg-[hsl(var(--color-secondary-dark))]')
      expect(button).toHaveClass('px-6 py-3 text-lg')
      expect(button).toHaveClass('w-full')
    })
  })

  describe('Interaction', () => {
    test('handles click event', () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick}>Click me</Button>)
      const button = screen.getByRole('button', { name: 'Click me' })
      button.click()
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    test('does not trigger click when disabled', () => {
      const handleClick = jest.fn()
      render(<Button disabled onClick={handleClick}>Click me</Button>)
      const button = screen.getByRole('button', { name: 'Click me' })
      button.click()
      expect(handleClick).not.toHaveBeenCalled()
    })

    test('does not trigger click when isLoading', () => {
      const handleClick = jest.fn()
      render(<Button isLoading onClick={handleClick}>Click me</Button>)
      const button = screen.getByRole('button')
      button.click()
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('Ref Forwarding', () => {
    test('forwards ref to button element', () => {
      const ref = { current: null }
      render(<Button ref={ref}>Click me</Button>)
      expect(ref.current).toBeInstanceOf(HTMLButtonElement)
    })
  })
})
