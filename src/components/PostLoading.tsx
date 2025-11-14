import React from 'react'

const PostLoading = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="bg-gray-200 animate-pulse rounded w-48 h-8"></div>
            <nav className="hidden md:flex space-x-8">
              <div className="bg-gray-200 animate-pulse rounded w-16 h-4"></div>
              <div className="bg-gray-200 animate-pulse rounded w-16 h-4"></div>
              <div className="bg-gray-200 animate-pulse rounded w-16 h-4"></div>
              <div className="bg-gray-200 animate-pulse rounded w-16 h-4"></div>
              <div className="bg-gray-200 animate-pulse rounded w-16 h-4"></div>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <article className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gray-200 animate-pulse aspect-video w-full"></div>
          
          <div className="p-8">
            <div className="mb-6">
              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                <div className="bg-gray-200 animate-pulse rounded w-24 h-4"></div>
                <div className="bg-gray-200 animate-pulse rounded w-8 h-4"></div>
                <div className="bg-gray-200 animate-pulse rounded w-32 h-4"></div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="bg-gray-200 animate-pulse rounded-full w-20 h-6"></div>
                <div className="bg-gray-200 animate-pulse rounded-full w-24 h-6"></div>
              </div>
            </div>

            <div className="bg-gray-200 animate-pulse rounded w-full h-10 mb-6"></div>
            <div className="bg-gray-200 animate-pulse rounded w-3/4 h-10 mb-6"></div>

            <div className="space-y-4">
              <div className="bg-gray-200 animate-pulse rounded w-full h-4"></div>
              <div className="bg-gray-200 animate-pulse rounded w-full h-4"></div>
              <div className="bg-gray-200 animate-pulse rounded w-5/6 h-4"></div>
              <div className="bg-gray-200 animate-pulse rounded w-full h-4"></div>
              <div className="bg-gray-200 animate-pulse rounded w-2/3 h-4"></div>
            </div>

            <div className="mt-8 pt-6 border-t">
              <div className="text-sm font-semibold text-gray-500 mb-3 bg-gray-200 animate-pulse rounded w-16 h-4"></div>
              <div className="flex flex-wrap gap-2">
                <div className="bg-gray-200 animate-pulse rounded-full w-16 h-6"></div>
                <div className="bg-gray-200 animate-pulse rounded-full w-20 h-6"></div>
              </div>
            </div>
          </div>
        </article>

        <div className="mt-8">
          <div className="bg-gray-200 animate-pulse rounded w-32 h-6"></div>
        </div>
      </main>

      <footer className="bg-gray-800 text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="bg-gray-700 animate-pulse rounded w-64 h-4"></div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default PostLoading