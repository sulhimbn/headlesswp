import { render, screen, waitFor } from '@testing-library/react'
import ServiceStatus from '@/components/ui/ServiceStatus'

describe('ServiceStatus Component', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  describe('Rendering', () => {
    test('renders status button', () => {
      render(<ServiceStatus />)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    test('renders with correct aria-label for healthy status', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'healthy' })
      })

      render(<ServiceStatus />)
      await waitFor(() => {
        expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Layanan beroperasi normal')
      })
    })

    test('renders with correct aria-label for degraded status', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'degraded' })
      })

      render(<ServiceStatus />)
      await waitFor(() => {
        expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Layanan mengalami gangguan')
      })
    })

    test('renders with correct aria-label for down status on fetch error', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

      render(<ServiceStatus />)
      await waitFor(() => {
        expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Layanan tidak tersedia')
      })
    })
  })

  describe('Status Indicator', () => {
    test('shows green indicator for healthy status', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'healthy' })
      })

      render(<ServiceStatus />)
      await waitFor(() => {
        const indicator = screen.getByRole('button').querySelector('.bg-green-500')
        expect(indicator).toBeInTheDocument()
      })
    })

    test('shows yellow indicator for degraded status', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'degraded' })
      })

      render(<ServiceStatus />)
      await waitFor(() => {
        const indicator = screen.getByRole('button').querySelector('.bg-yellow-500')
        expect(indicator).toBeInTheDocument()
      })
    })

    test('shows red indicator for down status', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

      render(<ServiceStatus />)
      await waitFor(() => {
        const indicator = screen.getByRole('button').querySelector('.bg-red-500')
        expect(indicator).toBeInTheDocument()
      })
    })
  })

  describe('Tooltip', () => {
    test('shows tooltip on click', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'healthy' })
      })

      render(<ServiceStatus />)
      const button = screen.getByRole('button')
      button.click()

      await waitFor(() => {
        expect(screen.getByText('Layanan beroperasi normal')).toBeInTheDocument()
      })
    })
  })

  describe('Health Check API', () => {
    test('fetches health status on mount', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'healthy' })
      })

      render(<ServiceStatus />)
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/health', expect.any(Object))
      })
    })

    test('uses correct fetch options', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'healthy' })
      })

      render(<ServiceStatus />)
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/health', {
          signal: expect.any(AbortSignal),
          cache: 'no-store'
        })
      })
    })

    test('polls health status every 30 seconds', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'healthy' })
      })

      render(<ServiceStatus />)
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1)
      })

      jest.advanceTimersByTime(30000)
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2)
      })

      jest.advanceTimersByTime(30000)
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(3)
      })
    })

    test('clears interval on unmount', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'healthy' })
      })

      const { unmount } = render(<ServiceStatus />)
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1)
      })

      unmount()
      
      jest.advanceTimersByTime(30000)
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1)
      })
    })

    test('handles non-ok response as degraded', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500
      })

      render(<ServiceStatus />)
      
      await waitFor(() => {
        expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Layanan mengalami gangguan')
      })
    })
  })

  describe('Accessibility', () => {
    test('button has correct focus styles', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'healthy' })
      })

      render(<ServiceStatus />)
      
      await waitFor(() => {
        const button = screen.getByRole('button')
        expect(button).toHaveClass('focus:outline-none')
        expect(button).toHaveClass('focus:ring-2')
        expect(button).toHaveClass('focus:ring-offset-2')
      })
    })

    test('status indicator is hidden from screen readers', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'healthy' })
      })

      render(<ServiceStatus />)
      
      await waitFor(() => {
        const indicator = screen.getByRole('button').querySelector('[aria-hidden="true"]')
        expect(indicator).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    test('handles invalid status response as degraded', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'unknown' })
      })

      render(<ServiceStatus />)
      
      await waitFor(() => {
        expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Layanan mengalami gangguan')
      })
    })

    test('handles empty response as degraded', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({})
      })

      render(<ServiceStatus />)
      
      await waitFor(() => {
        expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Layanan mengalami gangguan')
      })
    })
  })
})
