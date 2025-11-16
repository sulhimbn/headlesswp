import React from 'react'
import { render, screen } from '@testing-library/react'
import PostLoading from '@/components/PostLoading'

describe('PostLoading', () => {
  it('renders loading skeleton correctly', () => {
    render(<PostLoading />)

    // Check main container
    const mainContainer = screen.getByRole('main')
    expect(mainContainer).toBeInTheDocument()
    expect(mainContainer).toHaveClass('max-w-4xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'py-8')

    // Check header skeleton elements
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('banner')).toHaveClass('bg-white', 'shadow-sm')
  })

  it('renders article loading skeleton', () => {
    render(<PostLoading />)

    const article = screen.getByRole('article')
    expect(article).toBeInTheDocument()
    expect(article).toHaveClass('bg-white', 'rounded-lg', 'shadow-lg', 'overflow-hidden')
  })

  it('has proper accessibility structure', () => {
    render(<PostLoading />)

    // Check for proper landmark elements
    expect(screen.getByRole('banner')).toBeInTheDocument() // header
    expect(screen.getByRole('main')).toBeInTheDocument() // main content
    expect(screen.getByRole('contentinfo')).toBeInTheDocument() // footer
  })

  it('contains skeleton loading elements with proper classes', () => {
    render(<PostLoading />)

    // Check for skeleton elements with animate-pulse class
    const skeletonElements = document.querySelectorAll('.animate-pulse')
    expect(skeletonElements.length).toBeGreaterThan(0)

    // Check specific skeleton elements
    const titleSkeleton = document.querySelector('.bg-gray-200.animate-pulse.rounded.w-full.h-10')
    expect(titleSkeleton).toBeInTheDocument()

    const contentSkeletons = document.querySelectorAll('.bg-gray-200.animate-pulse.rounded.w-full.h-4')
    expect(contentSkeletons.length).toBeGreaterThan(0)
  })

  it('has responsive design classes', () => {
    render(<PostLoading />)

    // Check responsive container classes
    const container = document.querySelector('.max-w-7xl.mx-auto.px-4.sm\\:px-6.lg\\:px-8')
    expect(container).toBeInTheDocument()

    // Check responsive navigation
    const nav = document.querySelector('.hidden.md\\:flex.space-x-8')
    expect(nav).toBeInTheDocument()
  })

  it('renders footer skeleton', () => {
    render(<PostLoading />)

    const footer = screen.getByRole('contentinfo')
    expect(footer).toBeInTheDocument()
    expect(footer).toHaveClass('bg-gray-800', 'text-white', 'mt-12')

    const footerContent = footer.querySelector('.text-center')
    expect(footerContent).toBeInTheDocument()
  })

  it('has proper semantic structure for loading state', () => {
    render(<PostLoading />)

    // Check that loading elements don't have misleading roles
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea')
    expect(interactiveElements.length).toBe(0) // No interactive elements in loading state

    // Check that skeleton elements are not focusable
    const skeletonElements = document.querySelectorAll('.animate-pulse')
    skeletonElements.forEach(element => {
      expect(element).not.toHaveAttribute('tabindex')
    })
  })

  it('maintains consistent loading layout structure', () => {
    const { container } = render(<PostLoading />)

    // Verify that the main structure is present
    expect(container.querySelector('header')).toBeInTheDocument()
    expect(container.querySelector('main')).toBeInTheDocument()
    expect(container.querySelector('footer')).toBeInTheDocument()
    expect(container.querySelector('article')).toBeInTheDocument()
  })

  it('has proper ARIA attributes for accessibility', () => {
    render(<PostLoading />)

    // Check that main landmark has proper labeling (implicit through role)
    const main = screen.getByRole('main')
    expect(main).toBeInTheDocument()

    // Ensure no aria-hidden attributes that would hide loading state from screen readers
    const ariaHiddenElements = document.querySelectorAll('[aria-hidden="true"]')
    expect(ariaHiddenElements.length).toBe(0)
  })

  it('uses semantic HTML5 elements correctly', () => {
    render(<PostLoading />)

    // Check for proper semantic structure
    expect(document.querySelector('header')).toBeInTheDocument()
    expect(document.querySelector('main')).toBeInTheDocument()
    expect(document.querySelector('article')).toBeInTheDocument()
    expect(document.querySelector('footer')).toBeInTheDocument()
    expect(document.querySelector('nav')).toBeInTheDocument()
  })
})