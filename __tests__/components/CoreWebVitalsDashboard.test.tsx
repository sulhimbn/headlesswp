import { render, screen, waitFor } from '@testing-library/react'
import CoreWebVitalsDashboard from '@/components/observability/CoreWebVitalsDashboard'

const mockMetricsResponse = {
  summary: {
    totalApiCalls: 100,
    totalErrorTypes: 2,
    totalWebVitalEvents: 50,
    timestamp: '2024-01-01T00:00:00Z',
    uptime: 3600
  },
  webVitals: {
    events: [
      { name: 'FCP', value: 1200, rating: 'good', id: '1', navigationType: 'navigate' },
      { name: 'LCP', value: 2800, rating: 'needs-improvement', id: '2', navigationType: 'navigate' },
      { name: 'CLS', value: 0.05, rating: 'good', id: '3', navigationType: 'navigate' },
      { name: 'INP', value: 180, rating: 'good', id: '4', navigationType: 'navigate' },
      { name: 'TTFB', value: 600, rating: 'good', id: '5', navigationType: 'navigate' }
    ],
    byMetricName: {
      FCP: { count: 10, avg: 1200, min: 800, max: 1800 },
      LCP: { count: 10, avg: 2800, min: 2000, max: 4000 },
      CLS: { count: 10, avg: 0.05, min: 0, max: 0.15 },
      INP: { count: 10, avg: 180, min: 100, max: 300 },
      TTFB: { count: 10, avg: 600, min: 400, max: 900 }
    }
  }
}

describe('CoreWebVitalsDashboard', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  describe('Rendering', () => {
    test('renders loading state initially', () => {
      global.fetch = jest.fn().mockImplementation(() => new Promise(() => {}))
      
      render(<CoreWebVitalsDashboard />)
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    test('renders dashboard with metrics data', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockMetricsResponse
      })

      render(<CoreWebVitalsDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Core Web Vitals')).toBeInTheDocument()
      })
    })

    test('displays all five core web vitals metrics', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockMetricsResponse
      })

      render(<CoreWebVitalsDashboard />)

      await waitFor(() => {
        const headings = screen.getAllByRole('heading', { level: 3 })
        const metricNames = headings.map(h => h.textContent).filter(Boolean)
        expect(metricNames).toContain('FCP')
        expect(metricNames).toContain('LCP')
        expect(metricNames).toContain('CLS')
        expect(metricNames).toContain('INP')
        expect(metricNames).toContain('TTFB')
      })
    })
  })

  describe('Rating Indicators', () => {
    test('displays good rating with green indicator', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockMetricsResponse
      })

      render(<CoreWebVitalsDashboard />)

      await waitFor(() => {
        const goodLabels = screen.getAllByText('Good')
        expect(goodLabels.length).toBeGreaterThan(0)
      })
    })

    test('displays needs-improvement rating with yellow indicator', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockMetricsResponse
      })

      render(<CoreWebVitalsDashboard />)

      await waitFor(() => {
        const ratings = screen.getAllByText('Needs Improvement')
        expect(ratings.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Recent Events Table', () => {
    test('displays recent events table', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockMetricsResponse
      })

      render(<CoreWebVitalsDashboard />)

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument()
      })
    })

    test('displays no events message when empty', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          summary: { totalWebVitalEvents: 0 },
          webVitals: { events: [], byMetricName: {} }
        })
      })

      render(<CoreWebVitalsDashboard />)

      await waitFor(() => {
        expect(screen.getByText('No web vitals events recorded yet')).toBeInTheDocument()
      })
    })
  })

  describe('API Integration', () => {
    test('fetches metrics on mount', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockMetricsResponse
      })

      render(<CoreWebVitalsDashboard />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/observability/performance', expect.any(Object))
      })
    })

    test('polls metrics every 10 seconds', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockMetricsResponse
      })

      render(<CoreWebVitalsDashboard />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1)
      })

      jest.advanceTimersByTime(10000)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2)
      })
    })

    test('clears interval on unmount', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockMetricsResponse
      })

      const { unmount } = render(<CoreWebVitalsDashboard />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1)
      })

      unmount()

      jest.advanceTimersByTime(10000)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Error Handling', () => {
    test('displays error message on fetch failure', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

      const { container } = render(<CoreWebVitalsDashboard />)

      await waitFor(() => {
        expect(container.querySelector('.text-\\[hsl\\(var\\(--color-error\\)\\)\\]')).toBeInTheDocument()
      })
    })
  })
})
