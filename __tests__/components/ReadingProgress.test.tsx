'use client'

import { render } from '@testing-library/react'
import ReadingProgress from '@/components/ui/ReadingProgress'

describe('ReadingProgress', () => {
  it('should return null when progress is zero', () => {
    Object.defineProperty(window, 'innerHeight', { value: 500, writable: true })
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 500, writable: true })
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true })

    const { container } = render(<ReadingProgress />)
    expect(container.firstChild).toBeNull()
  })
})