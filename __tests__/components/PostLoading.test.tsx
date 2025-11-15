import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import PostLoading from '@/components/PostLoading'

describe('PostLoading', () => {
  it('should render loading skeleton', () => {
    render(<PostLoading />)
    
    // Check that main loading container exists
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('should render header skeleton elements', () => {
    render(<PostLoading />)
    
    // Check for header element
    const header = screen.getByRole('banner')
    expect(header).toBeInTheDocument()
    expect(header).toHaveClass('bg-white', 'shadow-sm')
  })

  it('should render navigation placeholder elements', () => {
    render(<PostLoading />)
    
    // Check for navigation skeleton items
    const navElements = document.querySelectorAll('nav .animate-pulse')
    expect(navElements.length).toBeGreaterThan(0)
  })

  it('should render article content skeleton', () => {
    render(<PostLoading />)
    
    // Check for main article container
    const article = screen.getByRole('article')
    expect(article).toBeInTheDocument()
    expect(article).toHaveClass('bg-white', 'rounded-lg', 'shadow-lg')
  })

  it('should render featured media placeholder', () => {
    render(<PostLoading />)
    
    // Check for aspect video placeholder (featured image)
    const featuredMedia = document.querySelector('.aspect-video')
    expect(featuredMedia).toBeInTheDocument()
    expect(featuredMedia).toHaveClass('bg-gray-200', 'animate-pulse')
  })

  it('should render metadata skeleton elements', () => {
    render(<PostLoading />)
    
    // Check for date, author, and category placeholders
    const metadataElements = document.querySelectorAll('.text-sm .animate-pulse')
    expect(metadataElements.length).toBeGreaterThan(0)
  })

  it('should render title placeholder elements', () => {
    render(<PostLoading />)
    
    // Check for title skeleton lines
    const titleElements = document.querySelectorAll('.h-10')
    expect(titleElements.length).toBeGreaterThan(0)
  })

  it('should render content paragraph placeholders', () => {
    render(<PostLoading />)
    
    // Check for content line placeholders
    const contentLines = document.querySelectorAll('.space-y-4 .h-4')
    expect(contentLines.length).toBeGreaterThan(0)
  })

  it('should render tag skeleton elements', () => {
    render(<PostLoading />)
    
    // Check for tag placeholder pills
    const tagElements = document.querySelectorAll('.rounded-full')
    expect(tagElements.length).toBeGreaterThan(0)
  })

  it('should render footer skeleton', () => {
    render(<PostLoading />)
    
    // Check for footer element
    const footer = screen.getByRole('contentinfo')
    expect(footer).toBeInTheDocument()
    expect(footer).toHaveClass('bg-gray-800', 'text-white')
  })

  it('should have proper accessibility structure', () => {
    render(<PostLoading />)
    
    // Check for proper landmark elements
    expect(screen.getByRole('banner')).toBeInTheDocument() // header
    expect(screen.getByRole('main')).toBeInTheDocument() // main
    expect(screen.getByRole('article')).toBeInTheDocument() // article
    expect(screen.getByRole('contentinfo')).toBeInTheDocument() // footer
  })

  it('should apply consistent Tailwind classes', () => {
    render(<PostLoading />)
    
    // Check that skeleton elements have proper animation classes
    const animatedElements = document.querySelectorAll('.animate-pulse')
    expect(animatedElements.length).toBeGreaterThan(0)
    
    // Check that skeleton elements have proper gray background
    const skeletonElements = document.querySelectorAll('.bg-gray-200')
    expect(skeletonElements.length).toBeGreaterThan(0)
  })

  it('should have responsive design classes', () => {
    render(<PostLoading />)
    
    // Check for responsive breakpoints
    const responsiveElements = document.querySelectorAll('[class*="sm:"], [class*="md:"], [class*="lg:"]')
    expect(responsiveElements.length).toBeGreaterThan(0)
  })
})