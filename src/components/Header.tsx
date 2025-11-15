'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import MobileNavigation from './MobileNavigation'

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="text-xl sm:text-2xl font-bold text-red-600">
              Mitra Banten News
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-6 lg:space-x-8">
              <Link 
                href="/" 
                className="text-gray-700 hover:text-red-600 text-sm lg:text-base font-medium transition-colors"
              >
                Beranda
              </Link>
              <Link 
                href="/berita" 
                className="text-gray-700 hover:text-red-600 text-sm lg:text-base font-medium transition-colors"
              >
                Berita
              </Link>
              <Link 
                href="/politik" 
                className="text-gray-700 hover:text-red-600 text-sm lg:text-base font-medium transition-colors"
              >
                Politik
              </Link>
              <Link 
                href="/ekonomi" 
                className="text-gray-700 hover:text-red-600 text-sm lg:text-base font-medium transition-colors"
              >
                Ekonomi
              </Link>
              <Link 
                href="/olahraga" 
                className="text-gray-700 hover:text-red-600 text-sm lg:text-base font-medium transition-colors"
              >
                Olahraga
              </Link>
            </nav>

            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <MobileNavigation 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
    </>
  )
}