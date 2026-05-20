import { render, screen, act } from '@testing-library/react'
import ReadingProgress from '@/components/ui/ReadingProgress'

describe('ReadingProgress Component', () => {
  let addEventListenerSpy: jest.SpyInstance
  let removeEventListenerSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true })
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, writable: true })
    
    const mockElement = document.createElement('div')
    mockElement.id = 'article-content'
    document.body.appendChild(mockElement)
    
    addEventListenerSpy = jest.spyOn(window, 'addEventListener')
    removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
  })

  afterEach(() => {
    addEventListenerSpy.mockRestore()
    removeEventListenerSpy.mockRestore()
    
    const mockElement = document.getElementById('article-content')
    if (mockElement) {
      mockElement.remove()
    }
  })

  describe('Rendering', () => {
    test('renders reading progress bar when scrolling', async () => {
      window.scrollY = 100
      
      const { container } = await act(async () => {
        return render(<ReadingProgress targetId="article-content" />)
      })
      
      const progressBar = container.querySelector('[role="progressbar"]')
      expect(progressBar).toBeInTheDocument()
    })

    test('renders with default targetId', async () => {
      window.scrollY = 100
      
      const mockElement = document.getElementById('article-content')
      expect(mockElement).toBeInTheDocument()
      
      await act(async () => {
        render(<ReadingProgress />)
      })
      
      expect(addEventListenerSpy).toHaveBeenCalled()
    })

    test('renders with custom targetId', async () => {
      const customElement = document.createElement('div')
      customElement.id = 'custom-content'
      document.body.appendChild(customElement)
      
      window.scrollY = 100
      
      await act(async () => {
        render(<ReadingProgress targetId="custom-content" />)
      })
      
      expect(addEventListenerSpy).toHaveBeenCalled()
      
      customElement.remove()
    })
  })

  describe('Progress Calculation', () => {
    test('calculates correct progress percentage', async () => {
      window.scrollY = 500
      window.innerHeight = 500
      document.documentElement.scrollHeight = 1500

      const { container } = await act(async () => {
        return render(<ReadingProgress />)
      })
      
      const progressBar = container.querySelector('[role="progressbar"]')
      expect(progressBar).toHaveAttribute('aria-valuenow', '50')
    })

    test('caps progress at 100%', async () => {
      window.scrollY = 1500
      window.innerHeight = 500
      document.documentElement.scrollHeight = 1500

      const { container } = await act(async () => {
        return render(<ReadingProgress />)
      })
      
      const progressBar = container.querySelector('[role="progressbar"]')
      expect(progressBar).toHaveAttribute('aria-valuenow', '100')
    })

    test('minimum progress is 0%', async () => {
      window.scrollY = 100
      window.innerHeight = 768
      document.documentElement.scrollHeight = 2000

      const { container } = await act(async () => {
        return render(<ReadingProgress />)
      })
      
      const progressBar = container.querySelector('[role="progressbar"]')
      expect(progressBar).toHaveAttribute('aria-valuemin', '0')
    })

    test('maximum progress is 100', async () => {
      window.scrollY = 100
      window.innerHeight = 768
      document.documentElement.scrollHeight = 2000

      const { container } = await act(async () => {
        return render(<ReadingProgress />)
      })
      
      const progressBar = container.querySelector('[role="progressbar"]')
      expect(progressBar).toHaveAttribute('aria-valuemax', '100')
    })
  })

  describe('Positioning', () => {
    test('is fixed at top', async () => {
      window.scrollY = 100
      window.innerHeight = 768
      document.documentElement.scrollHeight = 2000

      const { container } = await act(async () => {
        return render(<ReadingProgress />)
      })
      
      const progressBar = container.querySelector('[role="progressbar"]')
      expect(progressBar).toHaveClass('fixed', 'top-0', 'left-0', 'right-0')
    })

    test('has z-index of 50', async () => {
      window.scrollY = 100
      window.innerHeight = 768
      document.documentElement.scrollHeight = 2000

      const { container } = await act(async () => {
        return render(<ReadingProgress />)
      })
      
      const progressBar = container.querySelector('[role="progressbar"]')
      expect(progressBar).toHaveClass('z-50')
    })
  })

  describe('Accessibility', () => {
    test('has progressbar role', async () => {
      window.scrollY = 100
      window.innerHeight = 768
      document.documentElement.scrollHeight = 2000

      const { container } = await act(async () => {
        return render(<ReadingProgress />)
      })
      
      expect(container.querySelector('[role="progressbar"]')).toBeInTheDocument()
    })

    test('has aria-label', async () => {
      window.scrollY = 100
      window.innerHeight = 768
      document.documentElement.scrollHeight = 2000

      const { container } = await act(async () => {
        return render(<ReadingProgress />)
      })
      
      const progressBar = container.querySelector('[role="progressbar"]')
      expect(progressBar).toHaveAttribute('aria-label', 'Kemajuan membaca')
    })
  })

  describe('Event Listeners', () => {
    test('adds scroll event listener', async () => {
      window.scrollY = 0
      window.innerHeight = 768
      document.documentElement.scrollHeight = 2000

      await act(async () => {
        render(<ReadingProgress />)
      })
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true })
    })

    test('adds resize event listener', async () => {
      window.scrollY = 0
      window.innerHeight = 768
      document.documentElement.scrollHeight = 2000

      await act(async () => {
        render(<ReadingProgress />)
      })
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function), { passive: true })
    })

    test('removes event listeners on unmount', async () => {
      window.scrollY = 0
      window.innerHeight = 768
      document.documentElement.scrollHeight = 2000

      const { unmount } = await act(async () => {
        return render(<ReadingProgress />)
      })
      await act(async () => {
        unmount()
      })
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    })
  })

  describe('Edge Cases', () => {
    test('returns null when element not found', async () => {
      const existingElement = document.getElementById('article-content')
      if (existingElement) {
        existingElement.remove()
      }
      
      window.scrollY = 0
      window.innerHeight = 768
      document.documentElement.scrollHeight = 2000

      const { container } = await act(async () => {
        return render(<ReadingProgress targetId="nonexistent" />)
      })
      
      expect(container.firstChild).toBeNull()
    })

    test('handles zero document height', async () => {
      window.scrollY = 0
      window.innerHeight = 768
      document.documentElement.scrollHeight = 768

      const { container } = await act(async () => {
        return render(<ReadingProgress />)
      })
      
      expect(container.firstChild).toBeNull()
    })
  })
})