'use client'

import React, { useState } from 'react'
import Link from 'next/link'

interface MobileNavigationProps {
  isOpen: boolean
  onClose: () => void
}

export default function MobileNavigation({ isOpen, onClose }: MobileNavigationProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Mobile menu panel */}
      <div className="fixed right-0 top-0 h-full w-64 bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <span className="text-lg font-semibold text-gray-900">Menu</span>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            aria-label="Close menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <Link
                href="/"
                className="block px-4 py-3 text-base font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-red-600"
                onClick={onClose}
              >
                Beranda
              </Link>
            </li>
            <li>
              <Link
                href="/berita"
                className="block px-4 py-3 text-base font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-red-600"
                onClick={onClose}
              >
                Berita
              </Link>
            </li>
            <li>
              <Link
                href="/politik"
                className="block px-4 py-3 text-base font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-red-600"
                onClick={onClose}
              >
                Politik
              </Link>
            </li>
            <li>
              <Link
                href="/ekonomi"
                className="block px-4 py-3 text-base font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-red-600"
                onClick={onClose}
              >
                Ekonomi
              </Link>
            </li>
            <li>
              <Link
                href="/olahraga"
                className="block px-4 py-3 text-base font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-red-600"
                onClick={onClose}
              >
                Olahraga
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  )
}