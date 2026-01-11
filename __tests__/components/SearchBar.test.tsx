import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import SearchBar from '@/components/ui/SearchBar'

describe('SearchBar Component', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Rendering', () => {
    test('renders search input with default placeholder', () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} />)
      const input = screen.getByLabelText('Search')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('placeholder', 'Search...')
    })

    test('renders search input with custom placeholder', () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} placeholder="Search articles..." />)
      const input = screen.getByLabelText('Search')
      expect(input).toHaveAttribute('placeholder', 'Search articles...')
    })

    test('renders search icon', () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} />)
      const searchIcon = document.querySelector('[aria-hidden="true"] svg')
      expect(searchIcon).toBeInTheDocument()
    })

    test('renders with custom className', () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} className="custom-class" />)
      const form = screen.getByRole('search')
      expect(form).toHaveClass('custom-class')
    })

    test('renders with initial value', () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} initialValue="initial" />)
      const input = screen.getByLabelText('Search') as HTMLInputElement
      expect(input.value).toBe('initial')
    })

    test('renders with custom aria label', () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} ariaLabel="Search news" />)
      const input = screen.getByLabelText('Search news')
      expect(input).toBeInTheDocument()
    })
  })

  describe('User Input', () => {
    test('updates query value on input change', async () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} />)
      const input = screen.getByLabelText('Search') as HTMLInputElement

      fireEvent.change(input, { target: { value: 'test query' } })

      expect(input.value).toBe('test query')
    })

    test('calls onSearch after debounce delay', async () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} debounceMs={300} />)
      const input = screen.getByLabelText('Search') as HTMLInputElement

      fireEvent.change(input, { target: { value: 'test' } })
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(onSearch).toHaveBeenLastCalledWith('test')
      })
    })

    test('debounces multiple rapid changes', async () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} debounceMs={300} />)
      const input = screen.getByLabelText('Search') as HTMLInputElement

      fireEvent.change(input, { target: { value: 'a' } })
      jest.advanceTimersByTime(100)

      fireEvent.change(input, { target: { value: 'ab' } })
      jest.advanceTimersByTime(100)

      fireEvent.change(input, { target: { value: 'abc' } })
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(onSearch).toHaveBeenLastCalledWith('abc')
      })
    })
  })

  describe('Clear Button', () => {
    test('shows clear button when query is not empty', () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} />)
      const input = screen.getByLabelText('Search') as HTMLInputElement

      fireEvent.change(input, { target: { value: 'test' } })

      const clearButton = screen.getByLabelText('Clear search')
      expect(clearButton).toBeInTheDocument()
    })

    test('does not show clear button when query is empty', () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} />)

      const clearButton = screen.queryByLabelText('Clear search')
      expect(clearButton).not.toBeInTheDocument()
    })

    test('clears query when clear button is clicked', () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} />)
      const input = screen.getByLabelText('Search') as HTMLInputElement

      fireEvent.change(input, { target: { value: 'test' } })
      const clearButton = screen.getByLabelText('Clear search')

      fireEvent.click(clearButton)

      expect(input.value).toBe('')
    })

    test('focuses input after clearing', () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} />)
      const input = screen.getByLabelText('Search') as HTMLInputElement

      fireEvent.change(input, { target: { value: 'test' } })
      const clearButton = screen.getByLabelText('Clear search')

      input.blur()
      expect(document.activeElement).not.toBe(input)

      fireEvent.click(clearButton)
      expect(document.activeElement).toBe(input)
    })

    test('calls onSearch with empty string after clearing', async () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} debounceMs={100} />)
      const input = screen.getByLabelText('Search') as HTMLInputElement

      fireEvent.change(input, { target: { value: 'test' } })
      const clearButton = screen.getByLabelText('Clear search')

      fireEvent.click(clearButton)
      jest.advanceTimersByTime(100)

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('')
      })
    })
  })

  describe('Loading State', () => {
    test('does not show clear button when loading', () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} isLoading />)
      const input = screen.getByLabelText('Search') as HTMLInputElement

      fireEvent.change(input, { target: { value: 'test' } })

      const clearButton = screen.queryByLabelText('Clear search')
      expect(clearButton).not.toBeInTheDocument()
    })

    test('shows loading spinner when isLoading is true', () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} isLoading />)

      const loadingSpinner = document.querySelector('.animate-spin')
      expect(loadingSpinner).toBeInTheDocument()
    })

    test('disables input when isLoading is true', () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} isLoading />)
      const input = screen.getByLabelText('Search')

      expect(input).toBeDisabled()
    })

    test('sets aria-busy on input when isLoading is true', () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} isLoading />)
      const input = screen.getByLabelText('Search')

      expect(input).toHaveAttribute('aria-busy', 'true')
    })

    test('does not show loading spinner when isLoading is false', () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} isLoading={false} />)

      const loadingSpinner = document.querySelector('.animate-spin')
      expect(loadingSpinner).not.toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    test('prevents default form submission', () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} />)
      const input = screen.getByLabelText('Search') as HTMLInputElement

      fireEvent.change(input, { target: { value: 'test' } })
      const form = screen.getByRole('search')

      const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
      const eventSpy = jest.spyOn(submitEvent, 'preventDefault')

      fireEvent(form, submitEvent)

      expect(submitEvent.defaultPrevented).toBe(true)
    })

    test('calls onSearch immediately on form submit', () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} debounceMs={500} />)
      const input = screen.getByLabelText('Search') as HTMLInputElement

      fireEvent.change(input, { target: { value: 'test' } })
      jest.advanceTimersByTime(100)

      const form = screen.getByRole('search')
      fireEvent.submit(form)

      expect(onSearch).toHaveBeenCalledWith('test')
    })
  })

  describe('Accessibility', () => {
    test('has proper role="search" on form', () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} />)
      const form = screen.getByRole('search')
      expect(form).toBeInTheDocument()
    })

    test('has associated label for input', () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} />)
      const label = screen.getByLabelText('Search')
      expect(label).toBeInTheDocument()
    })

    test('screen reader only label is present', () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} />)
      const label = document.querySelector('label.sr-only')
      expect(label).toBeInTheDocument()
    })

    test('clear button has accessible label', () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} />)
      const input = screen.getByLabelText('Search') as HTMLInputElement

      fireEvent.change(input, { target: { value: 'test' } })

      const clearButton = screen.getByLabelText('Clear search')
      expect(clearButton).toBeInTheDocument()
    })

    test('search icon is hidden from screen readers', () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} />)
      const iconContainer = document.querySelector('[aria-hidden="true"]')
      expect(iconContainer).toBeInTheDocument()
    })

    test('loading indicator is hidden from screen readers', () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} isLoading />)
      const loadingContainer = document.querySelector('.animate-spin')?.parentElement
      expect(loadingContainer).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('Design Tokens', () => {
    test('input uses design tokens for colors', () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} />)
      const input = screen.getByLabelText('Search')

      expect(input).toHaveClass('bg-[hsl(var(--color-surface))]')
      expect(input).toHaveClass('text-[hsl(var(--color-text-primary))]')
      expect(input).toHaveClass('border-[hsl(var(--color-border))]')
    })

    test('input uses design tokens for radius', () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} />)
      const input = screen.getByLabelText('Search')

      expect(input).toHaveClass('rounded-[var(--radius-md)]')
    })

    test('input uses design tokens for transitions', () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} />)
      const input = screen.getByLabelText('Search')

      expect(input).toHaveClass('duration-[var(--transition-fast)]')
    })

    test('clear button uses design tokens', () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} />)
      const input = screen.getByLabelText('Search') as HTMLInputElement

      fireEvent.change(input, { target: { value: 'test' } })
      const clearButton = screen.getByLabelText('Clear search')

      expect(clearButton).toHaveClass('text-[hsl(var(--color-text-muted))]')
      expect(clearButton).toHaveClass('rounded-[var(--radius-sm)]')
    })
  })

  describe('Responsive Design', () => {
    test('input has responsive padding', () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} />)
      const input = screen.getByLabelText('Search')

      expect(input).toHaveClass('py-2 sm:py-3')
    })

    test('input has responsive font size', () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} />)
      const input = screen.getByLabelText('Search')

      expect(input).toHaveClass('text-sm sm:text-base')
    })

    test('search icon has fixed size across breakpoints', () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} />)
      const searchIcon = document.querySelector('[aria-hidden="true"] svg')

      expect(searchIcon).toHaveClass('h-5 w-5')
    })
  })

  describe('Focus Management', () => {
    test('input has focus ring styles', () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} />)
      const input = screen.getByLabelText('Search')

      expect(input).toHaveClass('focus:ring-2')
      expect(input).toHaveClass('focus:ring-[hsl(var(--color-primary))]')
    })

    test('clear button has focus styles', () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} />)
      const input = screen.getByLabelText('Search') as HTMLInputElement

      fireEvent.change(input, { target: { value: 'test' } })
      const clearButton = screen.getByLabelText('Clear search')

      expect(clearButton).toHaveClass('focus:ring-2')
      expect(clearButton).toHaveClass('focus:ring-[hsl(var(--color-primary))]')
    })
  })

  describe('Keyboard Navigation', () => {
    test('input can receive focus', () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} />)
      const input = screen.getByLabelText('Search')

      input.focus()
      expect(document.activeElement).toBe(input)
    })

    test('clear button can receive focus', () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} />)
      const input = screen.getByLabelText('Search') as HTMLInputElement

      fireEvent.change(input, { target: { value: 'test' } })
      const clearButton = screen.getByLabelText('Clear search')

      clearButton.focus()
      expect(document.activeElement).toBe(clearButton)
    })

    test('Enter key in form triggers search', async () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} debounceMs={500} />)
      const input = screen.getByLabelText('Search') as HTMLInputElement

      fireEvent.change(input, { target: { value: 'test' } })
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })

      expect(onSearch).toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    test('handles empty string search', async () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} debounceMs={100} />)
      const input = screen.getByLabelText('Search') as HTMLInputElement

      fireEvent.change(input, { target: { value: '' } })
      jest.advanceTimersByTime(100)

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('')
      })
    })

    test('handles special characters in search query', async () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} debounceMs={100} />)
      const input = screen.getByLabelText('Search') as HTMLInputElement

      const specialChars = '<script>alert("test")</script>'
      fireEvent.change(input, { target: { value: specialChars } })
      jest.advanceTimersByTime(100)

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith(specialChars)
      })
    })

    test('handles very long search query', async () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} debounceMs={100} />)
      const input = screen.getByLabelText('Search') as HTMLInputElement

      const longQuery = 'a'.repeat(1000)
      fireEvent.change(input, { target: { value: longQuery } })
      jest.advanceTimersByTime(100)

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith(longQuery)
      })
    })

    test('handles rapid toggle of loading state', () => {
      const onSearch = jest.fn()
      const { rerender } = render(<SearchBar onSearch={onSearch} isLoading={false} />)

      rerender(<SearchBar onSearch={onSearch} isLoading={true} />)
      rerender(<SearchBar onSearch={onSearch} isLoading={false} />)
      rerender(<SearchBar onSearch={onSearch} isLoading={true} />)

      const loadingSpinner = document.querySelector('.animate-spin')
      expect(loadingSpinner).toBeInTheDocument()
    })
  })

  describe('Custom Debounce', () => {
    test('uses custom debounce time', async () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} debounceMs={500} />)
      const input = screen.getByLabelText('Search') as HTMLInputElement

      fireEvent.change(input, { target: { value: 'test' } })
      jest.advanceTimersByTime(500)

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('test')
      })
    })

    test('clears previous timeout on new input', async () => {
      const onSearch = jest.fn()
      render(<SearchBar onSearch={onSearch} debounceMs={500} />)
      const input = screen.getByLabelText('Search') as HTMLInputElement

      fireEvent.change(input, { target: { value: 'a' } })
      jest.advanceTimersByTime(300)

      fireEvent.change(input, { target: { value: 'ab' } })
      jest.advanceTimersByTime(500)

      expect(onSearch).toHaveBeenCalled()
    })
  })
})
