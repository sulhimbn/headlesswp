'use client'

import { render, screen } from '@testing-library/react'
import SocialShare from '@/components/ui/SocialShare'

describe('SocialShare', () => {
  it('should render all share platforms', () => {
    render(<SocialShare title="Test Title" url="https://example.com/test" />)

    expect(screen.getByLabelText('Bagikan ke Facebook')).toBeInTheDocument()
    expect(screen.getByLabelText('Bagikan ke Twitter')).toBeInTheDocument()
    expect(screen.getByLabelText('Bagikan ke WhatsApp')).toBeInTheDocument()
  })

  it('should render copy link button', () => {
    render(<SocialShare title="Test Title" url="https://example.com/test" />)

    expect(screen.getByLabelText('Salin tautan')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(<SocialShare title="Test Title" url="https://example.com/test" className="custom-class" />)
    expect(container.firstChild).toHaveClass('custom-class')
  })
})