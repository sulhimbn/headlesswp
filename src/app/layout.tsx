import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import ClientLayout from '@/components/ClientLayout'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL('https://mitrabantennews.com'),
  title: 'Mitra Banten News - Berita Terkini Banten',
  description: 'Portal berita terkini dan terpercaya dari Banten',
  keywords: 'berita banten, mitra banten news, berita terkini',
  openGraph: {
    title: 'Mitra Banten News',
    description: 'Portal berita terkini dan terpercaya dari Banten',
    url: 'https://mitrabantennews.com',
    siteName: 'Mitra Banten News',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <head>
        <meta name="csp-nonce" content="" />
        <link rel="preconnect" href="https://mitrabantennews.com" />
        <link rel="preconnect" href="https://www.mitrabantennews.com" />
        <link rel="dns-prefetch" href="https://mitrabantennews.com" />
        <link rel="dns-prefetch" href="https://www.mitrabantennews.com" />
      </head>
      <body className={inter.className}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-red-600 focus:text-white focus:rounded focus:shadow-lg focus:outline-none"
        >
          Langsung ke konten utama
        </a>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  )
}