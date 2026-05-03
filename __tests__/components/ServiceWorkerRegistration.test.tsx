'use client'

import { render } from '@testing-library/react'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'

describe('ServiceWorkerRegistration', () => {
  it('should render null', () => {
    const { container } = render(<ServiceWorkerRegistration />)
    expect(container.firstChild).toBeNull()
  })

  it('should handle browsers without service worker support', () => {
    const originalNavigator = global.navigator
    Object.defineProperty(global, 'navigator', {
      value: { serviceWorker: undefined },
      writable: true,
    })

    const { container } = render(<ServiceWorkerRegistration />)
    expect(container.firstChild).toBeNull()

    global.navigator = originalNavigator
  })
})