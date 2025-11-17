import React from 'react'
import { render, screen } from '@testing-library/react'
import PostLoading from '@/components/PostLoading'

describe('PostLoading Component', () => {
  it('should render the loading skeleton structure', () => {
    render(<PostLoading />)
    
    // Check main container
    expect(screen.getByRole('main')).toBeInTheDocument()
    
    // Check header
    const header = screen.getByRole('banner')
    expect(header).toBeInTheDocument()
    expect(header).toHaveClass('bg-white', 'shadow-sm')
    
    // Check footer
    const footer = screen.getByRole('contentinfo')
    expect(footer).toBeInTheDocument()
    expect(footer).toHaveClass('bg-gray-800', 'text-white')
  })

  it('should render skeleton elements with correct classes', () => {
    render(<PostLoading />)
    
    // Check skeleton elements (gray boxes with animate-pulse)
    const skeletonElements = document.querySelectorAll('.animate-pulse')
    expect(skeletonElements.length).toBeGreaterThan(0)
    
    // Check that skeleton elements have bg-gray-200 class
    const graySkeletons = document.querySelectorAll('.bg-gray-200.animate-pulse')
    expect(graySkeletons.length).toBeGreaterThan(0)
  })

  it('should render header navigation skeleton items', () => {
    render(<PostLoading />)
    
    // Check logo skeleton
    const logoSkeleton = document.querySelector('.bg-gray-200.animate-pulse.rounded.w-48.h-8')
    expect(logoSkeleton).toBeInTheDocument()
    
    // Check navigation skeleton items
    const navSkeletons = document.querySelectorAll('.bg-gray-200.animate-pulse.rounded.w-16.h-4')
    expect(navSkeletons.length).toBe(6) // 6 nav items as per the component
  })

  it('should render article content skeleton', () => {
    render(<PostLoading />)
    
    // Check main article container
    const article = document.querySelector('article')
    expect(article).toBeInTheDocument()
    expect(article).toHaveClass('bg-white', 'rounded-lg', 'shadow-lg', 'overflow-hidden')
    
    // Check featured image skeleton
    const imageSkeleton = document.querySelector('.bg-gray-200.animate-pulse.aspect-video.w-full')
    expect(imageSkeleton).toBeInTheDocument()
    
    // Check title skeleton
    const titleSkeleton = document.querySelector('.bg-gray-200.animate-pulse.rounded.w-full.h-10')
    expect(titleSkeleton).toBeInTheDocument()
  })

  it('should render metadata skeleton items', () => {
    render(<PostLoading />)
    
    // Check date and author metadata skeletons
    const metadataSkeletons = document.querySelectorAll('.bg-gray-200.animate-pulse.rounded')
    
    // Should have skeletons for date, separator, and author info
    const w24Skeleton = document.querySelector('.bg-gray-200.animate-pulse.rounded.w-24.h-4')
    const w8Skeleton = document.querySelector('.bg-gray-200.animate-pulse.rounded.w-8.h-4')
    const w32Skeleton = document.querySelector('.bg-gray-200.animate-pulse.rounded.w-32.h-4')
    
    expect(w24Skeleton).toBeInTheDocument() // Date
    expect(w8Skeleton).toBeInTheDocument()   // Separator
    expect(w32Skeleton).toBeInTheDocument()  // Author/category
  })

  it('should render category tag skeletons', () => {
    render(<PostLoading />)
    
    // Check category tag skeletons (rounded-full)
    const tagSkeletons = document.querySelectorAll('.bg-gray-200.animate-pulse.rounded-full')
    expect(tagSkeletons.length).toBeGreaterThan(0)
    
    // Check specific tag sizes
    const w20Tag = document.querySelector('.bg-gray-200.animate-pulse.rounded-full.w-20.h-6')
    const w24Tag = document.querySelector('.bg-gray-200.animate-pulse.rounded-full.w-24.h-6')
    
    expect(w20Tag).toBeInTheDocument()
    expect(w24Tag).toBeInTheDocument()
  })

  it('should render content paragraph skeletons', () => {
    render(<PostLoading />)
    
    // Check paragraph skeletons with different widths
    const paragraphSkeletons = document.querySelectorAll('.space-y-4 .bg-gray-200.animate-pulse.rounded')
    
    const fullWidth = document.querySelector('.space-y-4 .bg-gray-200.animate-pulse.rounded.w-full.h-4')
    const fiveSixthsWidth = document.querySelector('.space-y-4 .bg-gray-200.animate-pulse.rounded.w-5\\/6.h-4')
    const twoThirdsWidth = document.querySelector('.space-y-4 .bg-gray-200.animate-pulse.rounded.w-2\\/3.h-4')
    
    expect(fullWidth).toBeInTheDocument()
    expect(fiveSixthsWidth).toBeInTheDocument()
    expect(twoThirdsWidth).toBeInTheDocument()
  })

  it('should render author section skeleton', () => {
    render(<PostLoading />)
    
    // Check author section heading skeleton
    const authorHeading = document.querySelector('.text-sm.font-semibold.text-gray-500.mb-3.bg-gray-200.animate-pulse.rounded.w-16.h-4')
    expect(authorHeading).toBeInTheDocument()
    
    // Check author tag skeletons
    const authorTags = document.querySelectorAll('.mt-8.pt-6.border-t .bg-gray-200.animate-pulse.rounded-full')
    expect(authorTags.length).toBe(2) // 2 author tags as per component
  })

  it('should render related posts section skeleton', () => {
    render(<PostLoading />)
    
    // Check related posts heading skeleton
    const relatedHeading = document.querySelector('.mt-8 .bg-gray-200.animate-pulse.rounded.w-32.h-6')
    expect(relatedHeading).toBeInTheDocument()
  })

  it('should render footer skeleton', () => {
    render(<PostLoading />)
    
    // Check footer content skeleton
    const footerSkeleton = document.querySelector('.bg-gray-700.animate-pulse.rounded.w-64.h-4')
    expect(footerSkeleton).toBeInTheDocument()
  })

  it('should have proper responsive design classes', () => {
    render(<PostLoading />)
    
    // Check responsive container classes
    const containers = document.querySelectorAll('.max-w-7xl.mx-auto.px-4.sm\\:px-6.lg\\:px-8')
    expect(containers.length).toBeGreaterThan(0)
    
    // Check responsive grid classes (if any)
    const responsiveElements = document.querySelectorAll('.md\\:flex, .sm\\:px-6, .lg\\:px-8')
    expect(responsiveElements.length).toBeGreaterThan(0)
  })

  it('should maintain consistent loading state structure', () => {
    const { container } = render(<PostLoading />)
    
    // Check that the component has the expected structure
    expect(container.firstChild).toHaveClass('min-h-screen', 'bg-gray-50')
    
    // Verify no actual content is loaded (only skeletons)
    expect(screen.queryByText(/Terjadi Kesalahan/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    
    // Verify skeleton elements are present but empty
    const skeletonElements = container.querySelectorAll('.animate-pulse')
    skeletonElements.forEach(element => {
      expect(element.textContent).toBe('')
    })
  })

  it('should be accessible with proper semantic structure', () => {
    render(<PostLoading />)
    
    // Check for proper semantic HTML5 elements
    expect(screen.getByRole('banner')).toBeInTheDocument() // header
    expect(screen.getByRole('main')).toBeInTheDocument()   // main
    expect(screen.getByRole('contentinfo')).toBeInTheDocument() // footer
    
    // Check for article structure
    const articles = document.querySelectorAll('article')
    expect(articles.length).toBe(1)
  })
})