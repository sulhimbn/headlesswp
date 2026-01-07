import Link from 'next/link'
import React from 'react'

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-red-600">
            Mitra Banten News
          </Link>
          <nav className="hidden md:flex space-x-8">
            <Link href="/" className="text-gray-700 hover:text-red-600">Beranda</Link>
            <Link href="/berita" className="text-gray-700 hover:text-red-600">Berita</Link>
            <Link href="/politik" className="text-gray-700 hover:text-red-600">Politik</Link>
            <Link href="/ekonomi" className="text-gray-700 hover:text-red-600">Ekonomi</Link>
            <Link href="/olahraga" className="text-gray-700 hover:text-red-600">Olahraga</Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
