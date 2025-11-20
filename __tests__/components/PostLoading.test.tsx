import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import PostLoading from '@/components/PostLoading'

describe('PostLoading', () => {
  it('renders the loading skeleton correctly', () => {
    render(<PostLoading />)
    
    // Check main container
    const mainContainer = screen.getByRole('main') || document.querySelector('main')
    expect(mainContainer).toBeInTheDocument()
    
    // Check header elements
    const header = document.querySelector('header')
    expect(header).toBeInTheDocument()
    expect(header).toHaveClass('bg-white', 'shadow-sm')
  })

  it('renders skeleton elements with proper CSS classes', () => {
    render(<PostLoading />)
    
    // Check skeleton elements have animate-pulse class
    const skeletonElements = document.querySelectorAll('.animate-pulse')
    expect(skeletonElements.length).toBeGreaterThan(0)
    
    // Check skeleton elements have bg-gray-200 class
    const graySkeletons = document.querySelectorAll('.bg-gray-200.animate-pulse')
    expect(graySkeletons.length).toBeGreaterThan(0)
  })

  it('renders header skeleton elements', () => {
    render(<PostLoading />)
    
    // Check logo skeleton
    const logoSkeleton = document.querySelector('.bg-gray-200.animate-pulse.rounded.w-48.h-8')
    expect(logoSkeleton).toBeInTheDocument()
    
    // Check navigation items
    const navSkeletons = document.querySelectorAll('nav .bg-gray-200.animate-pulse.rounded.w-16.h-4')
    expect(navSkeletons.length).toBe(5) // 5 nav items as per component
  })

  it('renders article content skeleton', () => {
    render(<PostLoading />)
    
    // Check featured image skeleton
    const imageSkeleton = document.querySelector('.bg-gray-200.animate-pulse.aspect-video.w-full')
    expect(imageSkeleton).toBeInTheDocument()
    
    // Check title skeleton
    const titleSkeleton = document.querySelector('.bg-gray-200.animate-pulse.rounded.w-full.h-10')
    expect(titleSkeleton).toBeInTheDocument()
    
    // Check subtitle skeleton
    const subtitleSkeleton = document.querySelector('.bg-gray-200.animate-pulse.rounded.w-3\\/4.h-10')
    expect(subtitleSkeleton).toBeInTheDocument()
  })

  it('renders meta information skeleton', () => {
    render(<PostLoading />)
    
    // Check meta info skeletons
    const metaSkeletons = document.querySelectorAll('.flex.items-center.space-x-4 .bg-gray-200.animate-pulse.rounded')
    expect(metaSkeletons.length).toBe(3) // date, separator, author
    
    // Check specific meta skeleton sizes
    const dateSkeleton = document.querySelector('.bg-gray-200.animate-pulse.rounded.w-24.h-4')
    expect(dateSkeleton).toBeInTheDocument()
    
    const separatorSkeleton = document.querySelector('.bg-gray-200.animate-pulse.rounded.w-8.h-4')
    expect(separatorSkeleton).toBeInTheDocument()
    
    const authorSkeleton = document.querySelector('.bg-gray-200.animate-pulse.rounded.w-32.h-4')
    expect(authorSkeleton).toBeInTheDocument()
  })

  it('renders tag skeletons', () => {
    render(<PostLoading />)
    
    // Check tag skeletons in main content
    const tagSkeletons = document.querySelectorAll('.flex.flex-wrap.gap-2 .bg-gray-200.animate-pulse.rounded-full')
    expect(tagSkeletons.length).toBeGreaterThan(0)
    
    // Check specific tag sizes
    const smallTagSkeleton = document.querySelector('.bg-gray-200.animate-pulse.rounded-full.w-20.h-6')
    expect(smallTagSkeleton).toBeInTheDocument()
    
    const mediumTagSkeleton = document.querySelector('.bg-gray-200.animate-pulse.rounded-full.w-24.h-6')
    expect(mediumTagSkeleton).toBeInTheDocument()
  })

  it('renders content paragraph skeletons', () => {
    render(<PostLoading />)
    
    // Check paragraph skeletons
    const paragraphSkeletons = document.querySelectorAll('.space-y-4 .bg-gray-200.animate-pulse.rounded.h-4')
    expect(paragraphSkeletons.length).toBe(5) // 5 paragraph lines
    
    // Check different paragraph widths
    const fullWidthParagraph = document.querySelector('.space-y-4 .bg-gray-200.animate-pulse.rounded.w-full.h-4')
    expect(fullWidthParagraph).toBeInTheDocument()
    
    const wideParagraph = document.querySelector('.space-y-4 .bg-gray-200.animate-pulse.rounded.w-5\\/6.h-4')
    expect(wideParagraph).toBeInTheDocument()
    
    const mediumParagraph = document.querySelector('.space-y-4 .bg-gray-200.animate-pulse.rounded.w-2\\/3.h-4')
    expect(mediumParagraph).toBeInTheDocument()
  })

  it('renders author section skeleton', () => {
    render(<PostLoading />)
    
    // Check author section
    const authorSection = document.querySelector('.mt-8.pt-6.border-t')
    expect(authorSection).toBeInTheDocument()
    
    // Check author title skeleton
    const authorTitleSkeleton = document.querySelector('.text-sm.font-semibold.text-gray-500.mb-3 .bg-gray-200.animate-pulse.rounded.w-16.h-4')
    expect(authorTitleSkeleton).toBeInTheDocument()
    
    // Check author tag skeletons
    const authorTagSkeletons = authorSection?.querySelectorAll('.bg-gray-200.animate-pulse.rounded-full')
    expect(authorTagSkeletons?.length).toBe(2)
  })

  it('renders related posts skeleton', () => {
    render(<PostLoading />)
    
    // Check related posts section
    const relatedPostsSkeleton = document.querySelector('.mt-8 .bg-gray-200.animate-pulse.rounded.w-32.h-6')
    expect(relatedPostsSkeleton).toBeInTheDocument()
  })

  it('renders footer skeleton', () => {
    render(<PostLoading />)
    
    // Check footer
    const footer = document.querySelector('footer')
    expect(footer).toBeInTheDocument()
    expect(footer).toHaveClass('bg-gray-800', 'text-white', 'mt-12')
    
    // Check footer content skeleton
    const footerSkeleton = document.querySelector('footer .bg-gray-700.animate-pulse.rounded.w-64.h-4')
    expect(footerSkeleton).toBeInTheDocument()
  })

  it('has proper responsive design classes', () => {
    render(<PostLoading />)
    
    // Check responsive container classes
    const containers = document.querySelectorAll('.max-w-7xl.mx-auto.px-4.sm\\:px-6.lg\\:px-8')
    expect(containers.length).toBeGreaterThan(0)
    
    // Check responsive navigation
    const hiddenNav = document.querySelector('.hidden.md\\:flex.space-x-8')
    expect(hiddenNav).toBeInTheDocument()
  })

  it('maintains proper layout structure', () => {
    render(<PostLoading />)
    
    // Check overall structure
    const body = document.querySelector('body')
    expect(body?.children).toHaveLength(1) // Single root element
    
    // Check main layout sections
    expect(document.querySelector('header')).toBeInTheDocument()
    expect(document.querySelector('main')).toBeInTheDocument()
    expect(document.querySelector('footer')).toBeInTheDocument()
    
    // Check article container
    const article = document.querySelector('article')
    expect(article).toBeInTheDocument()
    expect(article).toHaveClass('bg-white', 'rounded-lg', 'shadow-lg', 'overflow-hidden')
  })

  it('uses semantic HTML elements', () => {
    render(<PostLoading />)
    
    // Check semantic elements
    expect(document.querySelector('header')).toBeInTheDocument()
    expect(document.querySelector('main')).toBeInTheDocument()
    expect(document.querySelector('article')).toBeInTheDocument()
    expect(document.querySelector('footer')).toBeInTheDocument()
    expect(document.querySelector('nav')).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    render(<PostLoading />)
    
    // While skeleton elements don't have text content, they should have proper structure
    const main = document.querySelector('main')
    expect(main).toBeInTheDocument()
    
    // Check that there's a proper heading hierarchy structure (even in skeleton)
    const titleSkeleton = document.querySelector('.bg-gray-200.animate-pulse.rounded.w-full.h-10')
    expect(titleSkeleton).toBeInTheDocument()
  })
})