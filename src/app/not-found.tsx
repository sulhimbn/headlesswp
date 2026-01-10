import Link from 'next/link'
import Button from '@/components/ui/Button'
import { UI_TEXT } from '@/lib/constants/uiText'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-red-600 mb-4">404</h1>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {UI_TEXT.notFound.heading}
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            {UI_TEXT.notFound.description}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button variant="primary" size="lg" className="w-full sm:w-auto">
              {UI_TEXT.notFound.backToHome}
            </Button>
          </Link>
          <Link href="/berita">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              {UI_TEXT.notFound.viewNews}
            </Button>
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            {UI_TEXT.notFound.contactHelp}{' '}
            <Link href="/" className="text-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 rounded">
              {UI_TEXT.notFound.contactUs}
            </Link>{' '}
            atau coba pencarian lain.
          </p>
        </div>
      </div>
    </div>
  )
}
