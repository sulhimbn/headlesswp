import React from 'react'

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center">
          <p className="text-sm sm:text-base">
            &copy; 2024 Mitra Banten News. All rights reserved.
          </p>
          <div className="mt-4 flex justify-center space-x-6">
            <a 
              href="#" 
              className="text-gray-400 hover:text-white text-sm transition-colors"
              aria-label="Facebook"
            >
              Facebook
            </a>
            <a 
              href="#" 
              className="text-gray-400 hover:text-white text-sm transition-colors"
              aria-label="Twitter"
            >
              Twitter
            </a>
            <a 
              href="#" 
              className="text-gray-400 hover:text-white text-sm transition-colors"
              aria-label="Instagram"
            >
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}