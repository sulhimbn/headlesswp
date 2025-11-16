import { render, screen } from '@testing-library/react'
import { Analytics } from '@/components/Analytics'

// Mock the analytics module
jest.mock('@/lib/analytics', () => ({
  pageview: jest.fn(),
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

describe('Analytics Component', () => {
  beforeEach(() => {
    // Clear DOM and mocks
    document.head.innerHTML = ''
    jest.clearAllMocks()
    
    // Mock gtag
    Object.defineProperty(window, 'gtag', {
      value: jest.fn(),
      writable: true,
    })
  })

  it('should render without crashing', () => {
    render(<Analytics />)
    // Analytics component doesn't render any visible content
    expect(document.body).toBeInTheDocument()
  })

  it('should not add scripts when GA_ID is not set', () => {
    process.env.NEXT_PUBLIC_GA_ID = ''
    
    render(<Analytics />)
    
    const scripts = document.querySelectorAll('script')
    expect(scripts).toHaveLength(0)
  })

  it('should add Google Analytics scripts when GA_ID is set', () => {
    process.env.NEXT_PUBLIC_GA_ID = 'GA-TEST-123'
    
    render(<Analytics />)
    
    const scripts = document.querySelectorAll('script')
    expect(scripts).toHaveLength(2)
    
    // Check if the first script is the gtag script
    const gtagScript = scripts[0]
    expect(gtagScript.src).toContain('googletagmanager.com')
    expect(gtagScript.async).toBe(true)
  })

  it('should initialize gtag configuration', () => {
    process.env.NEXT_PUBLIC_GA_ID = 'GA-TEST-123'
    
    render(<Analytics />)
    
    const configScript = document.querySelectorAll('script')[1]
    expect(configScript.innerHTML).toContain('GA-TEST-123')
    expect(configScript.innerHTML).toContain('gtag')
  })

  it('should clean up scripts on unmount', () => {
    process.env.NEXT_PUBLIC_GA_ID = 'GA-TEST-123'
    
    const { unmount } = render(<Analytics />)
    
    expect(document.querySelectorAll('script')).toHaveLength(2)
    
    unmount()
    
    expect(document.querySelectorAll('script')).toHaveLength(0)
  })
})